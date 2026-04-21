import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Container, Offcanvas, Row, Spinner, Badge, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import { useAuth } from "../auth/AuthContext";
import { createChatHubConnection } from "../signalr/chatHub";

export default function ChatShell() {
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
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState("");

  const [recentRooms, setRecentRooms] = useState([]);
  const [unreadDirectThreadIds, setUnreadDirectThreadIds] = useState(() => new Set());
  const [unreadRoomIds, setUnreadRoomIds] = useState(() => new Set());

  const activeRoomRef = useRef("");
 
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (!accessToken) return;
    loadRecentThreads();
     loadRecentRooms();
  }, [accessToken]);

  useEffect(() => {
    let mounted = true;

    const ensureConnected = async () => {
      if (!accessToken) return;                 // wait until authenticated
      if (hubRef.current) return;               // already built

      const conn = createChatHubConnection(() => accessToken);
      hubRef.current = conn;

      // conn.on("DirectMessage", (msg) => {
      //   // msg: { messageId, directThreadId, senderUserId, senderDisplayName, body, createdUtc, attachments }
      //   if (!msg?.directThreadId) return;

      //   // Use ref (NOT state) so we always compare against the current thread
      //   if (msg.directThreadId !== activeThreadRef.current) return;

      //   setDmMessages((prev) => {
      //     if (prev.some((m) => m.messageId === msg.messageId)) return prev; // dedupe
      //     return [...prev, msg];
      //   });

      //   scrollToBottom();
      // });
      conn.on("DirectMessage", (raw) => {
        // normalize possible PascalCase from SignalR
        const msg = {
          messageId: raw?.messageId ?? raw?.MessageId,
          directThreadId: raw?.directThreadId ?? raw?.DirectThreadId,
          senderUserId: raw?.senderUserId ?? raw?.SenderUserId,
          senderDisplayName: raw?.senderDisplayName ?? raw?.SenderDisplayName,
          body: raw?.body ?? raw?.Body,
          createdUtc: raw?.createdUtc ?? raw?.CreatedUtc,
          editedUtc: raw?.editedUtc ?? raw?.EditedUtc,
          deletedUtc: raw?.deletedUtc ?? raw?.DeletedUtc,
          isSystemMessage: raw?.isSystemMessage ?? raw?.IsSystemMessage,
          attachments: raw?.attachments ?? raw?.Attachments,
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
          postedAsDisplayName: raw?.postedAsDisplayName ?? raw?.PostedAsDisplayName,
          body: raw?.body ?? raw?.Body,
          createdUtc: raw?.createdUtc ?? raw?.CreatedUtc,
          attachments: raw?.attachments ?? raw?.Attachments,
        };

        if (!msg?.roomId) return;
        
        if (String(msg.roomId) !== String(activeRoomRef.current)) {
          markRoomUnread(msg.roomId);
        }

        setRecentRooms((prev) => {
          const list = Array.isArray(prev) ? [...prev] : [];
          const idx = list.findIndex((x) => String(x.roomId) === String(msg.roomId));

          if (idx >= 0) {
            list[idx] = {
              ...list[idx],
              lastMessagePreview: msg.body,
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

  const createRoom = async ({ sessionId, name, roomType, users }) => {
    const trimmedName = (name || "").trim();

    if (!sessionId) throw new Error("Session is required.");
    if (!trimmedName) throw new Error("Room name is required.");

    const createRes = await api.post("/api/rooms", {
      sessionId,
      classId: null,
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
      lastMessagePreview: null,
      lastActivityUtc: null
    });
  };

  const sendRoom = async () => {
    const body = draft.trim();
    if (!roomId || body.length === 0) return;

    setSendBusy(true);
    setRoomError("");

    try {
      const conn = hubRef.current;
      if (!conn || conn.state !== "Connected") {
        throw new Error("Chat connection is not ready.");
      }

      await conn.invoke("SendRoomMessage", roomId, body, []);
      setDraft("");
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
      activeRoomRef.current = rid;
      activeThreadRef.current ="";
      clearRoomUnread(rid);

      try {
        await api.post(`/api/rooms/${rid}/read`);
      } catch (e) {
        console.warn("Failed to mark room as read.", e);
      }

      const conn = hubRef.current;
      if (conn?.state === "Connected") {
        await conn.invoke("JoinRoom", rid);
      }

      await loadRoomHistory(rid);

      setDraft("");
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
    const ordered = [...raw].reverse();
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
    const ordered = [...raw].reverse();
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
      setDraft("");
      scrollToBottom();
    } catch (e) {
      setDmError("Failed to open direct message.");
    } finally {
      setDmBusy(false);
    }
  };

  const sendDirect = async () => {
    const body = draft.trim();
    if (!directThreadId || body.length === 0) return;

    setSendBusy(true);
    setDmError("");

    try {
      // POST /api/direct/{directThreadId}/messages { body }
      const res = await api.post(`/api/direct/${directThreadId}/messages`, { body });

      setDraft("");

      // const messageId = res.data?.messageId;
      // const createdUtc = res.data?.createdUtc;

      // // Optimistically append locally (fast UI)
      // setDmMessages((prev) => {
      //   const list = Array.isArray(prev) ? prev : [];

      //   if (
      //     messageId != null &&
      //     list.some((m) => String(m.messageId) === String(messageId))
      //   ) {
      //     return list; // SignalR already inserted it first
      //   }

      //   return [
      //     ...list,
      //     {
      //       messageId: messageId ?? `temp-${Date.now()}`,
      //       directThreadId,
      //       senderUserId: me?.userId,
      //       body,
      //       createdUtc: createdUtc ?? new Date().toISOString(),
      //       editedUtc: null,
      //       deletedUtc: null,
      //       isSystemMessage: false,
      //     },
      //   ];
      // });

      // setDraft("");
      // scrollToBottom();

      // Optional safety: re-fetch to ensure authoritative order/timestamps
      // (uncomment if you want absolute correctness early on)
      // await loadHistory(directThreadId);
      // scrollToBottom();
    } catch (e) {
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
          {/* <Sidebar onOpenDirect={openDirect} /> */}
          <Sidebar
            onOpenDirect={openDirect}
            onOpenRoom={openRoom}
            onCreateRoom={createRoom}
            recentThreads={recentThreads}
            recentRooms={recentRooms}
            recentBusy={recentBusy}
            recentError={recentError}
            unreadDirectThreadIds={unreadDirectThreadIds}
            unreadRoomIds={unreadRoomIds}
          />
        </Col>

        {/* Main */}
        <Col xs={12} lg={9} className="chat-main">
          <div className="chat-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                className="d-lg-none rounded-3"
                onClick={() => setShowSidebarMobile(true)}
              >
                ☰
              </Button>

              <div className="fw-semibold">{activeTitle}</div>

              {activeView && (
                <Badge bg="secondary">
                  {activeView === "direct" ? "Direct" : "Room"}
                </Badge>
              )}
            </div>

            <div className="small text-muted">
              Signed in as <span className="fw-semibold">{me?.displayName || me?.email}</span>
              {isTeacher && <span className="ms-2">(Teacher)</span>}
            </div>
          </div>

          <div className="chat-content px-3 py-3">
            {dmError && <div className="text-danger mb-2">{dmError}</div>}
            {roomError && <div className="text-danger mb-2">{roomError}</div>}

            {!activeView && (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="text-muted">
                  Search for a user on the left to start a Direct Message.
                </Card.Body>
              </Card>
            )}

            {activeView === "direct" && (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="fw-semibold">Messages</div>
                    {(dmBusy || sendBusy) && (
                      <div className="text-muted small d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        {dmBusy ? "Loading…" : "Sending…"}
                      </div>
                    )}
                  </div>

                  <div className="mt-3" style={{ maxHeight: "55vh", overflow: "auto" }}>
                    {dmMessages.length === 0 ? (
                      <div className="text-muted">No messages yet.</div>
                    ) : (
                      dmMessages.map((m) => {
                        const mine = me?.userId && m.senderUserId === me.userId;
                        return (
                          <div key={m.messageId} className={`mb-3 ${mine ? "text-end" : ""}`}>
                            <div className="small text-muted">
                              <span className="fw-semibold">
                                {mine ? "You" : (m.senderDisplayName ?? "User")}
                              </span>{" "}
                              · {m.createdUtc ? new Date(m.createdUtc).toLocaleString() : ""}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                          </div>
                        );
                      })
                    )}
                    <div ref={listEndRef} />
                  </div>

                  <div className="small text-muted mt-3">
                    DirectThreadId: <span className="font-monospace">{directThreadId}</span>
                  </div>
                </Card.Body>
              </Card>
            )}

            {activeView === "room" && (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="fw-semibold">Room Messages</div>
                    {(roomBusy || sendBusy) && (
                      <div className="text-muted small d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        {roomBusy ? "Loading…" : "Sending…"}
                      </div>
                    )}
                  </div>

                  <div className="mt-3" style={{ maxHeight: "55vh", overflow: "auto" }}>
                    {roomMessages.length === 0 ? (
                      <div className="text-muted">No messages yet.</div>
                    ) : (
                      roomMessages.map((m) => {
                        const mine = me?.userId && m.senderUserId === me.userId;
                        return (
                          <div key={m.messageId} className={`mb-3 ${mine ? "text-end" : ""}`}>
                            <div className="small text-muted">
                              <span className="fw-semibold">
                                {mine ? "You" : (m.postedAsDisplayName ?? "User")}
                              </span>{" "}
                              · {m.createdUtc ? new Date(m.createdUtc).toLocaleString() : ""}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                          </div>
                        );
                      })
                    )}
                    <div ref={listEndRef} />
                  </div>

                  <div className="small text-muted mt-3">
                    RoomId: <span className="font-monospace">{roomId}</span>
                  </div>
                </Card.Body>
              </Card>
            )}

          </div>

          {/* Composer enabled for Step 2 */}
          <div className="chat-composer border-top px-3 py-3">
            <Row className="g-2 align-items-end">
              {isTeacher && (
                <Col xs={12} md={4} lg={3}>
                  <Form.Label className="small text-muted mb-1">Post as (Teacher)</Form.Label>
                  <Form.Select className="rounded-3" disabled>
                    <option>(nickname dropdown later)</option>
                  </Form.Select>
                </Col>
              )}

              <Col xs={12} md={isTeacher ? 6 : 9} lg={isTeacher ? 7 : 9}>
                <Form.Label className="small text-muted mb-1">Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="rounded-3"
                  placeholder={
                    activeView === "direct"
                      ? "Type a message… (Enter to send, Shift+Enter for new line)"
                      : activeView === "room"
                      ? "Type a room message… (Enter to send, Shift+Enter for new line)"
                      : "Select a chat first…"
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  disabled={!activeView || sendBusy}
                />
              </Col>

              <Col xs={12} md={2} lg={2} className="d-grid">
                <Button
                  className="rounded-3 fw-semibold"
                  onClick={() => {
                    if (activeView === "direct") sendDirect();
                    else if (activeView === "room") sendRoom();
                  }}
                  disabled={!activeView || sendBusy || draft.trim().length === 0}
                >
                  {sendBusy ? "Sending…" : "Send"}
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Mobile sidebar */}
      <Offcanvas show={showSidebarMobile} onHide={() => setShowSidebarMobile(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chats</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
{/*           <Sidebar
            onOpenDirect={async (u) => {
              await openDirect(u);
              setShowSidebarMobile(false);
            }}
          /> */}
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