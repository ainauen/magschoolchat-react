import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Container, Offcanvas, Row, Spinner, Badge, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import ChatHeader from "./chat/ChatHeader";
import ChatMessageList from "./chat/ChatMessageList";
import ChatComposer from "./chat/ChatComposer";
import { useAuth } from "../auth/AuthContext";
import { createChatHubConnection } from "../signalr/chatHub";
import { normalizeAttachment } from "../utils/chatAttachmentUtils";

export default function ChatShell({ archiveRefreshKey = 0 }) {
  const { api, me, hasRole, accessToken } = useAuth();
  const isTeacher = hasRole("Teacher") || hasRole("Administrator");

  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  const [activeView, setActiveView] = useState(null); // "direct"
  const [activeTitle, setActiveTitle] = useState("Select a chat");

  const [directThreadId, setDirectThreadId] = useState("");
  const [dmMessages, setDmMessages] = useState([]);
  const [dmBusy, setDmBusy] = useState(false);
  const [dmError, setDmError] = useState("");

  const [draft, setDraft] = useState("");
  const [sendBusy, setSendBusy] = useState(false);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileError, setFileError] = useState("");

  const [nicknameOptions, setNicknameOptions] = useState([]);
  const [selectedPostAs, setSelectedPostAs] = useState("");
  const [nicknameBusy, setNicknameBusy] = useState(false);
  const [nicknameError, setNicknameError] = useState("");

  const listEndRef = useRef(null);

  const hubRef = useRef(null);
  //const joinedThreadRef = useRef(null);
  const activeThreadRef = useRef("");
  const pendingJoinRef = useRef(null);

  const [recentThreads, setRecentThreads] = useState([]);
  const [recentBusy, setRecentBusy] = useState(false);
  const [recentError, setRecentError] = useState("");

  const canManageRooms = hasRole("Teacher") || hasRole("Administrator");

  const [roomId, setRoomId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState("");

  const [recentRooms, setRecentRooms] = useState([]);
  const [unreadDirectThreadIds, setUnreadDirectThreadIds] = useState(() => new Set());
  const [unreadRoomIds, setUnreadRoomIds] = useState(() => new Set());

  const [archivedRooms, setArchivedRooms] = useState([]);
  const [archivedRoomsBusy, setArchivedRoomsBusy] = useState(false);
  const [archivedRoomsError, setArchivedRoomsError] = useState("");
  const canViewArchivedRooms =
    hasRole("Teacher") || hasRole("Administrator");

  const activeRoomRef = useRef("");
 
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const loadArchivedRooms = async () => {
    if (!canViewArchivedRooms) {
      setArchivedRooms([]);
      return;
    }

    setArchivedRoomsBusy(true);
    setArchivedRoomsError("");

    try {
      const res = await api.get("/api/archive/rooms");
      const list = Array.isArray(res.data) ? res.data : [];

      list.sort(
        (a, b) =>
          new Date(b.lastActivityUtc || b.archivedUtc || 0) -
          new Date(a.lastActivityUtc || a.archivedUtc || 0)
      );

      setArchivedRooms(list.map((r) => ({ ...r, isArchived: true })));
    } catch (e) {
      console.error(e);
      setArchivedRoomsError("Failed to load archived rooms.");
    } finally {
      setArchivedRoomsBusy(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    loadRecentThreads();
    loadRecentRooms();

    if (canViewArchivedRooms) {
      loadArchivedRooms();
    }

    if (isTeacher) {
      loadNicknameOptions();
    }
  }, [accessToken, isTeacher]);

  useEffect(() => {
    if (!accessToken) return;
    if (archiveRefreshKey === 0) return;

    const refreshAfterArchive = async () => {
      const [roomsResult, threadsResult, archivedResult] = await Promise.allSettled([
        api.get("/api/rooms"),
        api.get("/api/direct/threads", { params: { take: 30 } }),
        isTeacher ? api.get("/api/archive/rooms") : Promise.resolve({ data: [] }),
      ]);

      const activeRooms =
        roomsResult.status === "fulfilled" && Array.isArray(roomsResult.value.data)
          ? roomsResult.value.data
          : [];

      const activeThreads =
        threadsResult.status === "fulfilled" && Array.isArray(threadsResult.value.data)
          ? threadsResult.value.data
          : [];

      const archived =
        archivedResult.status === "fulfilled" && Array.isArray(archivedResult.value.data)
          ? archivedResult.value.data.map((r) => ({ ...r, isArchived: true }))
          : [];

      activeRooms.sort(
        (a, b) =>
          new Date(b.lastActivityUtc || 0) - new Date(a.lastActivityUtc || 0)
      );

      archived.sort(
        (a, b) =>
          new Date(b.lastActivityUtc || b.archivedUtc || 0) -
          new Date(a.lastActivityUtc || a.archivedUtc || 0)
      );

      setRecentRooms(activeRooms);
      setRecentThreads(activeThreads);
      setArchivedRooms(archived);

      setUnreadRoomIds(
        new Set(
          activeRooms
            .filter((r) => r.isUnread)
            .map((r) => String(r.roomId))
        )
      );

      setUnreadDirectThreadIds(
        new Set(
          activeThreads
            .filter((t) => t.isUnread)
            .map((t) => String(t.directThreadId))
        )
      );

      if (activeView === "direct") {
        setActiveView(null);
        setActiveTitle("Select a chat");
        setDirectThreadId("");
        setDmMessages([]);
        activeThreadRef.current = "";
        clearComposer();
        return;
      }

      if (activeView === "room" && roomId) {
        const activeRoom = activeRooms.find(
          (r) => String(r.roomId) === String(roomId)
        );

        const archivedRoom = archived.find(
          (r) => String(r.roomId) === String(roomId)
        );

        if (archivedRoom) {
          setSelectedRoom(archivedRoom);
          setActiveTitle(archivedRoom.name || "Room");
          activeRoomRef.current = "";
          clearComposer();
        } else if (activeRoom) {
          setSelectedRoom(activeRoom);
          activeRoomRef.current = activeRoom.roomId;
        } else {
          setActiveView(null);
          setActiveTitle("Select a chat");
          setRoomId("");
          setSelectedRoom(null);
          setRoomMessages([]);
          activeRoomRef.current = "";
          clearComposer();
        }
      }
    };

    refreshAfterArchive();
  }, [archiveRefreshKey]);

  useEffect(() => {
    let mounted = true;

    const ensureConnected = async () => {
      if (!accessToken) return;                 // wait until authenticated
      if (hubRef.current) return;               // already built

      const conn = createChatHubConnection(() => accessToken);
      hubRef.current = conn;

      conn.on("DirectMessage", (raw) => {
        const msg = {
          messageId: raw?.messageId ?? raw?.MessageId,
          directThreadId: raw?.directThreadId ?? raw?.DirectThreadId,
          senderUserId: raw?.senderUserId ?? raw?.SenderUserId,
          postedAsNicknameId: raw?.postedAsNicknameId ?? raw?.PostedAsNicknameId,
          senderDisplayName: raw?.senderDisplayName ?? raw?.SenderDisplayName,
          postedAsDisplayName: raw?.postedAsDisplayName ?? raw?.PostedAsDisplayName,
          body: raw?.body ?? raw?.Body,
          createdUtc: raw?.createdUtc ?? raw?.CreatedUtc,
          editedUtc: raw?.editedUtc ?? raw?.EditedUtc,
          deletedUtc: raw?.deletedUtc ?? raw?.DeletedUtc,
          isSystemMessage: raw?.isSystemMessage ?? raw?.IsSystemMessage,
          attachments: (raw?.attachments ?? raw?.Attachments ?? []).map(normalizeAttachment),
        };

        if (!msg?.directThreadId) return;

        if (String(msg.directThreadId) !== String(activeThreadRef.current)) {
          markDirectUnread(msg.directThreadId);
          return;
        }
       // if (msg.directThreadId !== activeThreadRef.current) return;

        setDmMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];

          // dedupe: if we already have it, do nothing
          if (
            msg?.messageId != null &&
            list.some((m) => String(m.messageId) === String(msg.messageId))
          ) {
            return list;
          }

          // otherwise append
          return [...list, msg];
        });
          // if (msg.messageId && prev.some((m) => m.messageId === msg.messageId)) return prev;
          // return [...prev, msg];
   

        scrollToBottom();
      });

      conn.on("DirectThreadUpdated", (raw) => {
        const ev = {
          directThreadId: raw?.directThreadId ?? raw?.DirectThreadId,
          otherUserId: raw?.otherUserId ?? raw?.OtherUserId,
          otherDisplayName: raw?.otherDisplayName ?? raw?.OtherDisplayName,
          otherEmail: raw?.otherEmail ?? raw?.OtherEmail,
          lastMessagePreview: raw?.lastMessagePreview ?? raw?.LastMessagePreview,
          lastActivityUtc: raw?.lastActivityUtc ?? raw?.LastActivityUtc,
        };

        if (!ev.directThreadId) return;

       // if (activeView !== "direct" || String(ev.directThreadId) !== String(activeThreadRef.current)) {
       //   markDirectUnread(ev.directThreadId);
       // }

        if (String(ev.directThreadId) !== String(activeThreadRef.current)) {
          markDirectUnread(ev.directThreadId);
        }

        setRecentThreads((prev) => {
          const list = Array.isArray(prev) ? [...prev] : [];

          const idx = list.findIndex(
            (x) => String(x.directThreadId) === String(ev.directThreadId)
          );

          if (idx >= 0) list[idx] = ev;
          else list.push(ev);

          list.sort(
            (a, b) => new Date(b.lastActivityUtc) - new Date(a.lastActivityUtc)
          );

          return list;
        });
      });

      conn.on("RoomMessage", (raw) => {

        const msg = {
          messageId: raw?.messageId ?? raw?.MessageId,
          roomId: raw?.roomId ?? raw?.RoomId,
          senderUserId: raw?.senderUserId ?? raw?.SenderUserId,
          postedAsNicknameId: raw?.postedAsNicknameId ?? raw?.PostedAsNicknameId,
          senderDisplayName: raw?.senderDisplayName ?? raw?.SenderDisplayName,
          postedAsDisplayName: raw?.postedAsDisplayName ?? raw?.PostedAsDisplayName,
          body: raw?.body ?? raw?.Body,
          createdUtc: raw?.createdUtc ?? raw?.CreatedUtc,
          attachments: (raw?.attachments ?? raw?.Attachments ?? []).map(normalizeAttachment),
        };

        if (!msg?.roomId) return;
        
        if (String(msg.roomId) !== String(activeRoomRef.current)) {
          markRoomUnread(msg.roomId);
        }

        setRecentRooms((prev) => {
          const list = Array.isArray(prev) ? [...prev] : [];
          const idx = list.findIndex((x) => String(x.roomId) === String(msg.roomId));

          const roomPreview =
            (msg.body || "").trim() ||
            (msg.attachments?.length === 1
              ? `Attachment: ${msg.attachments[0].fileName || "file"}`
              : msg.attachments?.length > 1
              ? `Attachments: ${msg.attachments.length} files`
              : "");

          if (idx >= 0) {
            list[idx] = {
              ...list[idx],
              lastMessagePreview: roomPreview,
              lastActivityUtc: msg.createdUtc,
            };
          }

          list.sort(
            (a, b) =>
              new Date(b.lastActivityUtc || 0) - new Date(a.lastActivityUtc || 0)
          );

          return list;
        });

        if (String(msg.roomId) !== String(activeRoomRef.current)) return;

        setRoomMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];

          if (
            msg?.messageId != null &&
            list.some((m) => String(m.messageId) === String(msg.messageId))
          ) {
            return list;
          }

          return [...list, msg];
        });

        scrollToBottom();
      });

      conn.on("RoomUpdated", (raw) => {
        const ev = {
          roomId: raw?.roomId ?? raw?.RoomId,
          name: raw?.name ?? raw?.Name,
          roomType: raw?.roomType ?? raw?.RoomType,
          sessionId: raw?.sessionId ?? raw?.SessionId,
          classId: raw?.classId ?? raw?.ClassId,
          lastMessagePreview: raw?.lastMessagePreview ?? raw?.LastMessagePreview,
          lastActivityUtc: raw?.lastActivityUtc ?? raw?.LastActivityUtc,
        };

        if (!ev.roomId) return;

      //  if (activeView !== "room" || String(ev.roomId) !== String(activeRoomRef.current)) {
      //    markRoomUnread(ev.roomId);
      //  }

        if (String(ev.roomId) !== String(activeRoomRef.current)) {
          markRoomUnread(ev.roomId);
        }

        setRecentRooms((prev) => {
          const list = Array.isArray(prev) ? [...prev] : [];
          const idx = list.findIndex((x) => String(x.roomId) === String(ev.roomId));

          if (idx >= 0) list[idx] = { ...list[idx], ...ev };
          else list.push(ev);

          list.sort(
            (a, b) =>
              new Date(b.lastActivityUtc || 0) - new Date(a.lastActivityUtc || 0)
          );

          return list;
        });
      });

      // conn.on("DirectThreadUpdated", (ev) => {

      //   setRecentThreads(prev => {

      //     const list = [...prev];

      //     const idx = list.findIndex(
      //       x => x.directThreadId === ev.directThreadId
      //     );

      //     if (idx >= 0)
      //         list[idx] = ev;
      //     else
      //         list.push(ev);

      //     list.sort(
      //       (a,b) =>
      //         new Date(b.lastActivityUtc) -
      //         new Date(a.lastActivityUtc)
      //     );

      //     return list;
      //   });

      // });

      conn.onreconnected(async () => {
        const tid = activeThreadRef.current;
        const rid = activeRoomRef.current;

        try {
          if (tid) {
            await conn.invoke("JoinDirectThread", tid);
          }

          if (rid) {
            await conn.invoke("JoinRoom", rid);
          }
        } catch (e) {
          console.warn("Re-join failed:", e);
        }
      });

      try {
        await conn.start();
        if (!mounted) return;

        // If user selected a thread before the hub connected, join it now.
        if (pendingJoinRef.current) {
          const tid = pendingJoinRef.current;
          pendingJoinRef.current = null;
          activeThreadRef.current = tid;

          try {
            await conn.invoke("JoinDirectThread", tid);
          } catch (e) {
            console.warn("JoinDirectThread failed after connect:", e);
          }
        }
      } catch (e) {
        console.error("SignalR start failed", e);
      }
    };

    ensureConnected();

    return () => {
      mounted = false;
      // Optional: keep connection alive app-wide, or stop when ChatShell unmounts:
      // hubRef.current?.stop();
      // hubRef.current = null;
    };
  }, [accessToken]); 

  // const handleArchiveChanged = async () => {
  //   await Promise.all([
  //     loadRecentRooms(),
  //     loadRecentThreads(),
  //     canViewArchivedRooms ? loadArchivedRooms() : Promise.resolve()
  //   ]);

  //   if (activeView === "room" && selectedRoom?.isArchived) {
  //     // optional: leave it open if teacher/admin is viewing archived room
  //   }

  //   if (activeView === "direct") {
  //     setActiveView(null);
  //     setDirectThreadId(null);
  //     setDirectMessages([]);
  //     setSelectedDirectUser(null);
  //   }
  // };

  const loadNicknameOptions = async () => {
    if (!isTeacher) return;

    setNicknameBusy(true);
    setNicknameError("");

    try {
      const res = await api.get("/api/teacher/nicknames");
      const rows = Array.isArray(res.data?.nicknames) ? res.data.nicknames : [];
      const activeId = res.data?.activeNicknameId || "";

      const activeRows = rows.filter((x) => x.isActive);

      setNicknameOptions(activeRows);
      setSelectedPostAs(activeId ? String(activeId) : "");
    } catch (e) {
      console.error(e);
      setNicknameError("Failed to load nickname options.");
    } finally {
      setNicknameBusy(false);
    }
  };

    const handlePostAsChange = async (e) => {
    const value = e.target.value;

    setSelectedPostAs(value);
    setNicknameBusy(true);
    setNicknameError("");

    try {
      if (!value) {
        await api.post("/api/teacher/nicknames/active", {
          nicknameId: null,
        });
      } else {
        await api.post("/api/teacher/nicknames/active", {
          nicknameId: value,
        });
      }
    } catch (err) {
      console.error(err);
      setNicknameError("Failed to update posting identity.");
      await loadNicknameOptions();
    } finally {
      setNicknameBusy(false);
    }
  };

  const markDirectUnread = (threadId) => {
    if (!threadId) return;
    setUnreadDirectThreadIds((prev) => {
      const next = new Set(prev);
      next.add(String(threadId));
      return next;
    });
  };

  const clearDirectUnread = (threadId) => {
    if (!threadId) return;
    setUnreadDirectThreadIds((prev) => {
      const next = new Set(prev);
      next.delete(String(threadId));
      return next;
    });
  };

  const markRoomUnread = (roomId) => {
    if (!roomId) return;
    setUnreadRoomIds((prev) => {
      const next = new Set(prev);
      next.add(String(roomId));
      return next;
    });
  };

  const clearRoomUnread = (roomId) => {
    if (!roomId) return;
    setUnreadRoomIds((prev) => {
      const next = new Set(prev);
      next.delete(String(roomId));
      return next;
    });
  };
  const createRoom = async ({ sessionId, classId, name, roomType, users }) => {
    const trimmedName = (name || "").trim();

    if (!classId) throw new Error("Class is required.");
    if (!sessionId) throw new Error("Session is required.");
    if (!trimmedName) throw new Error("Room name is required.");

    const createRes = await api.post("/api/rooms", {
      sessionId,
      classId,
      name: trimmedName,
      roomType
    });

    const newRoomId = createRes.data?.roomId;
    if (!newRoomId) throw new Error("Room creation failed.");

    for (const u of users || []) {
      await api.post(`/api/rooms/${newRoomId}/members`, {
        userId: u.userId,
        memberRole: 0
      });
    }

    await loadRecentRooms();

    await openRoom({
      roomId: newRoomId,
      name: trimmedName,
      roomType,
      sessionId,
      classId,
      lastMessagePreview: null,
      lastActivityUtc: null
    });
  };


  const onFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);

    setFileError("");

    if (selected.length === 0) return;

    setPendingFiles((prev) => {
      const combined = [...prev, ...selected];

      if (combined.length > 10) {
        setFileError("You can attach up to 10 files per message.");
        return combined.slice(0, 10);
      }

      return combined;
    });

    e.target.value = "";
  };

  const removePendingFile = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearComposer = () => {
    setDraft("");
    setPendingFiles([]);
    setFileError("");
  };

  const uploadPendingFiles = async () => {
    if (pendingFiles.length === 0) return [];

    if (pendingFiles.length > 10) {
      throw new Error("Too many files.");
    }

    const endpoint =
      activeView === "room"
        ? `/api/rooms/${roomId}/attachments`
        : activeView === "direct"
        ? `/api/direct/${directThreadId}/attachments`
        : null;

    if (!endpoint) throw new Error("No chat selected.");

    const uploaded = [];

    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.append("file", file);

      const res = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      uploaded.push(normalizeAttachment(res.data));
    }

    return uploaded;
  };

  const downloadAttachment = async (attachment) => {
    const att = normalizeAttachment(attachment);
    if (!att.attachmentId) return;

    try {
      const res = await api.get(`/api/attachments/${att.attachmentId}/download`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = att.fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      setFileError("Failed to download attachment.");
    }
  };

  const getMessageDisplayName = (m) => {
    return (
      m?.postedAsDisplayName ||
      m?.senderDisplayName ||
      m?.PostedAsDisplayName ||
      m?.SenderDisplayName ||
      (String(m?.senderUserId ?? m?.SenderUserId) === String(me?.userId)
        ? me?.displayName || me?.email || "User"
        : "User")
    );
  };

  const sendRoom = async () => {
    const body = draft.trim();

    if (selectedRoom?.isArchived) {
      setRoomError("This room is archived and is read-only.");
      return;
    }

    if (!roomId || (body.length === 0 && pendingFiles.length === 0)) return;

    setSendBusy(true);
    setRoomError("");
    setFileError("");

    try {
      const conn = hubRef.current;
      if (!conn || conn.state !== "Connected") {
        throw new Error("Chat connection is not ready.");
      }

      const uploadedAttachments = await uploadPendingFiles();
      const attachmentIds = uploadedAttachments.map((a) => a.attachmentId);

      await conn.invoke("SendRoomMessage", roomId, body, attachmentIds);

      clearComposer();
    } catch (e) {
      console.error(e);
      setRoomError("Failed to send room message.");
    } finally {
      setSendBusy(false);
    }
  };

  const openRoom = async (room) => {
    setRoomError("");
    setRoomBusy(true);

    try {
      const rid = room.roomId;
      if (!rid) throw new Error("No roomId provided.");

      setActiveView("room");
      setActiveTitle(room.name || "Room");
      setRoomId(rid);
      setSelectedRoom(room);
      activeRoomRef.current = room.isArchived ? "" : rid;
      activeThreadRef.current = "";
      clearRoomUnread(rid);

      if (!room.isArchived) {
        try {
          await api.post(`/api/rooms/${rid}/read`);
        } catch (e) {
          console.warn("Failed to mark room as read.", e);
        }
      }

      const conn = hubRef.current;

      if (!room.isArchived && conn?.state === "Connected") {
        await conn.invoke("JoinRoom", rid);
      }

      await loadRoomHistory(rid);

      clearComposer();
      scrollToBottom();
    } catch (e) {
      console.error(e);
      setRoomError("Failed to open room.");
    } finally {
      setRoomBusy(false);
    }
  };

  const loadRoomHistory = async (rid) => {
    const res = await api.get(`/api/rooms/${rid}/messages`, { params: { take: 50 } });
    const raw = res.data?.items || [];
    const ordered = [...raw].reverse().map((m) => ({
      ...m,
      messageId: m.messageId ?? m.MessageId,
      roomId: m.roomId ?? m.RoomId,
      senderUserId: m.senderUserId ?? m.SenderUserId,
      postedAsNicknameId: m.postedAsNicknameId ?? m.PostedAsNicknameId,
      senderDisplayName: m.senderDisplayName ?? m.SenderDisplayName,
      postedAsDisplayName: m.postedAsDisplayName ?? m.PostedAsDisplayName,
      body: m.body ?? m.Body,
      createdUtc: m.createdUtc ?? m.CreatedUtc,
      attachments: (m.attachments ?? m.Attachments ?? []).map(normalizeAttachment),
    }));

    setRoomMessages(ordered);
  };

  const loadRecentRooms = async () => {
    try {
      const res = await api.get("/api/rooms");
      const list = Array.isArray(res.data) ? res.data : [];

      list.sort(
        (a, b) =>
          new Date(b.lastActivityUtc || 0) - new Date(a.lastActivityUtc || 0)
      );

      setRecentRooms(list);

      setUnreadRoomIds(
        new Set(
          list
            .filter((r) => r.isUnread)
            .map((r) => String(r.roomId))
        )
      );
    } catch (e) {
      console.error("Failed to load rooms.", e);
    }
  };

  const loadRecentThreads = async () => {
    setRecentBusy(true);
    setRecentError("");

    try {
      const res = await api.get("/api/direct/threads", { params: { take: 30 } });
      const list = Array.isArray(res.data) ? res.data : [];

      setRecentThreads(list);

      setUnreadDirectThreadIds(
        new Set(
          list
            .filter((t) => t.isUnread)
            .map((t) => String(t.directThreadId))
        )
      );
    } catch (e) {
      setRecentError("Failed to load recent chats.");
    } finally {
      setRecentBusy(false);
    }
  };

  const loadHistory = async (tid) => {
    const msgsRes = await api.get(`/api/direct/${tid}/messages`, { params: { take: 50 } });
    const raw = msgsRes.data || [];
    // API returns newest-first; reverse for chat display
    const ordered = [...raw].reverse().map((m) => ({
      ...m,
      messageId: m.messageId ?? m.MessageId,
      directThreadId: m.directThreadId ?? m.DirectThreadId,
      senderUserId: m.senderUserId ?? m.SenderUserId,
      postedAsNicknameId: m.postedAsNicknameId ?? m.PostedAsNicknameId,
      senderDisplayName: m.senderDisplayName ?? m.SenderDisplayName,
      postedAsDisplayName: m.postedAsDisplayName ?? m.PostedAsDisplayName,
      body: m.body ?? m.Body,
      createdUtc: m.createdUtc ?? m.CreatedUtc,
      editedUtc: m.editedUtc ?? m.EditedUtc,
      deletedUtc: m.deletedUtc ?? m.DeletedUtc,
      isSystemMessage: m.isSystemMessage ?? m.IsSystemMessage,
      attachments: (m.attachments ?? m.Attachments ?? []).map(normalizeAttachment),
    }));

    setDmMessages(ordered);
  };

  const openDirect = async (user) => {
    setDmError("");
    setDmBusy(true);

    try {
      // 1) create/get thread
      const threadRes = await api.post("/api/direct", { otherUserId: user.userId });
      const tid = threadRes.data?.directThreadId;

      if (!tid) throw new Error("No directThreadId returned.");

      setActiveView("direct");
      setActiveTitle(user.displayName || user.email);
      setDirectThreadId(tid);
      setSelectedRoom(null);
      // Track active thread immediately (ref is instant, state is async)
      activeThreadRef.current = tid;
      activeRoomRef.current = "";
      clearDirectUnread(tid);

      try {
        await api.post(`/api/direct/${tid}/read`);
      } catch (e) {
        console.warn("Failed to mark direct thread as read.", e);
      }

      try {
        const conn = hubRef.current;

        if (!conn) {
          // hub not created yet (boot race) → queue join
          pendingJoinRef.current = tid;
        } else if (conn.state === "Connected") {
          await conn.invoke("JoinDirectThread", tid);
        } else {
          // hub exists but not connected yet → queue join
          pendingJoinRef.current = tid;
        }
      } catch (e) {
        console.warn("JoinDirectThread failed", e);
      }

      // 2) load history
      await loadHistory(tid);

      await loadRecentThreads();

      // clear composer on open
      clearComposer();
      scrollToBottom();
    } catch (e) {
      setDmError("Failed to open direct message.");
    } finally {
      setDmBusy(false);
    }
  };

  const sendDirect = async () => {
    const body = draft.trim();

    if (!directThreadId || (body.length === 0 && pendingFiles.length === 0)) return;

    setSendBusy(true);
    setDmError("");
    setFileError("");

    try {
      const uploadedAttachments = await uploadPendingFiles();
      const attachmentIds = uploadedAttachments.map((a) => a.attachmentId);

      await api.post(`/api/direct/${directThreadId}/messages`, {
        body,
        attachmentIds,
      });

      clearComposer();
    } catch (e) {
      console.error(e);
      setDmError("Failed to send message.");
    } finally {
      setSendBusy(false);
    }
  };

  const onComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (activeView === "direct") {
        sendDirect();
      } else if (activeView === "room") {
        sendRoom();
      }
    }
  };

  // if user switches threads, keep bottom anchored after load
  useEffect(() => {
    if (activeView === "direct") scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, directThreadId]);

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* Desktop sidebar */}
        <Col lg={3} className="d-none d-lg-block border-end chat-sidebar">
          <Sidebar
            onOpenDirect={openDirect}
            onOpenRoom={openRoom}
            onCreateRoom={createRoom}
            recentThreads={recentThreads}
            recentRooms={recentRooms}
            archivedRooms={archivedRooms}
            archivedRoomsBusy={archivedRoomsBusy}
            archivedRoomsError={archivedRoomsError}
            recentBusy={recentBusy}
            recentError={recentError}
            unreadDirectThreadIds={unreadDirectThreadIds}
            unreadRoomIds={unreadRoomIds}
          />
        </Col>

        {/* Main chat area */}
        <Col lg={9} className="d-flex flex-column min-vh-100">
          <ChatHeader
            activeView={activeView}
            activeTitle={activeTitle}
            me={me}
            isTeacher={isTeacher}
            onOpenSidebar={() => setShowSidebarMobile(true)}
          />

          <div className="chat-content px-3 py-3 flex-grow-1">
            {dmError && <div className="text-danger mb-2">{dmError}</div>}
            {roomError && <div className="text-danger mb-2">{roomError}</div>}
            {nicknameError && <div className="text-danger mb-2">{nicknameError}</div>}

            {!activeView && (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="text-muted">
                  Search for a user on the left to start a Direct Message.
                </Card.Body>
              </Card>
            )}

            {activeView === "direct" && (
              <ChatMessageList
                title="Messages"
                messages={dmMessages}
                busy={dmBusy}
                sendBusy={sendBusy}
                emptyText="No messages yet."
                idLabel="DirectThreadId"
                idValue={directThreadId}
                me={me}
                listEndRef={listEndRef}
                getMessageDisplayName={getMessageDisplayName}
                onDownloadAttachment={downloadAttachment}
              />
            )}

            {activeView === "room" && (
              <ChatMessageList
                title="Room Messages"
                messages={roomMessages}
                busy={roomBusy}
                sendBusy={sendBusy}
                emptyText="No messages yet."
                idLabel="RoomId"
                idValue={roomId}
                me={me}
                listEndRef={listEndRef}
                getMessageDisplayName={getMessageDisplayName}
                onDownloadAttachment={downloadAttachment}
              />
            )}
          </div>

          <ChatComposer
            activeView={activeView}
            selectedRoom={selectedRoom}
            isTeacher={isTeacher}
            selectedPostAs={selectedPostAs}
            nicknameOptions={nicknameOptions}
            nicknameBusy={nicknameBusy}
            sendBusy={sendBusy}
            draft={draft}
            setDraft={setDraft}
            pendingFiles={pendingFiles}
            fileError={fileError}
            onFilesSelected={onFilesSelected}
            removePendingFile={removePendingFile}
            handlePostAsChange={handlePostAsChange}
            onComposerKeyDown={onComposerKeyDown}
            onSendDirect={sendDirect}
            onSendRoom={sendRoom}
          />
        </Col>
      </Row>

      {/* Mobile sidebar */}
      <Offcanvas show={showSidebarMobile} onHide={() => setShowSidebarMobile(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chats</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar
            onOpenDirect={async (u) => {
              await openDirect(u);
              setShowSidebarMobile(false);
            }}
            onOpenRoom={async (r) => {
              await openRoom(r);
              setShowSidebarMobile(false);
            }}
            onCreateRoom={createRoom}
            recentThreads={recentThreads}
            recentRooms={recentRooms}
            archivedRooms={archivedRooms}
            archivedRoomsBusy={archivedRoomsBusy}
            archivedRoomsError={archivedRoomsError}
            recentBusy={recentBusy}
            recentError={recentError}
            unreadDirectThreadIds={unreadDirectThreadIds}
            unreadRoomIds={unreadRoomIds}
          />
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}