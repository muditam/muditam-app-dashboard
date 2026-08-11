import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { io } from "socket.io-client";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://muditam-app-backend-ca1c8b03db09.herokuapp.com");
const MAX_ATTACHMENT_BYTES = 1.5 * 1024 * 1024;
const HUMAN_CALLS_URL = `${API_BASE_URL}/api/voice/human-calls`;
const CALL_EVENT_PREFIXES = [
  "Internet call ended",
  "Declined internet call",
  "Missed internet call",
];

const isImageAttachment = (attachment) =>
  attachment.type === "image" ||
  attachment.mimeType?.startsWith("image/") || 
  attachment.dataUri?.startsWith("data:image/");

const isAudioAttachment = (attachment) =>
  attachment.type === "audio" ||
  attachment.mimeType?.startsWith("audio/");

const attachmentUrl = (attachment) => {
  if (attachment.url?.startsWith("http")) return attachment.url;
  if (attachment.url) return `${API_BASE_URL}${attachment.url}`;
  return attachment.dataUri;
};

const getWsUrl = () => {
  const configured = import.meta.env.VITE_WS_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return API_BASE_URL.replace(/^http/, "ws");
};

const getSocketUrl = () => {
  const configured = import.meta.env.VITE_SOCKET_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return API_BASE_URL.replace(/\/$/, "");
};

const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
};

const timestampOf = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const sortMessagesOldestFirst = (messages = []) =>
  [...messages].sort((a, b) => timestampOf(a.createdAt) - timestampOf(b.createdAt));

const formatDuration = (durationMs = 0) => {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

const isCallEventMessage = (item) =>
  item?.senderType === "system" ||
  CALL_EVENT_PREFIXES.some((prefix) => String(item?.text || "").startsWith(prefix));

const upsertConversation = (items, conversation) => {
  if (!conversation?.phone) return items;

  const next = [];
  const conversationTime = new Date(conversation.lastMessageAt || 0).getTime();
  let inserted = false;
  let changed = false;

  for (const item of items) {
    if (item.phone === conversation.phone) {
      changed = true;
      continue;
    }

    if (!inserted && conversationTime >= new Date(item.lastMessageAt || 0).getTime()) {
      next.push(conversation);
      inserted = true;
    }
    next.push(item);
  }

  if (!inserted) next.push(conversation);
  return changed || next.length !== items.length ? next : items;
};

const removeConversationByPhone = (items, phone) => {
  let changed = false;
  const next = [];
  for (const item of items) {
    if (item.phone === phone) {
      changed = true;
      continue;
    }
    next.push(item);
  }
  return changed ? next : items;
};

const conversationShell = (summary) => summary ? { ...summary, messages: [] } : null;

export default function Chats() {
  const [conversations, setConversations] = useState([]);
  const [activePhone, setActivePhone] = useState("");
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadReady, setThreadReady] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [playingAudioKey, setPlayingAudioKey] = useState("");
  const [audioProgressMs, setAudioProgressMs] = useState(0);
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatusText, setCallStatusText] = useState("");
  const [callElapsed, setCallElapsed] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [callAction, setCallAction] = useState({ callId: "", type: "" });
  const [recordedCallsByPhone, setRecordedCallsByPhone] = useState(new Map());
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const agoraModuleRef = useRef(null);
  const agoraClientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const remoteAudioTrackRef = useRef(null);
  const audioQualityModeRef = useRef("high");
  const weakNetworkStreakRef = useRef(0);
  const strongNetworkStreakRef = useRef(0);
  const callTimerRef = useRef(null);
  const callStartedAtRef = useRef(0);
  const callConnectedRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingMimeTypeRef = useRef("");
  const recordingAudioContextRef = useRef(null);
  const recordingCallRef = useRef(null);
  const recordingUploadPromiseRef = useRef(null);
  const activeCallRef = useRef(null);
  const activePhoneRef = useRef("");
  const threadCacheRef = useRef(new Map());
  const threadAbortRef = useRef(null);
  const threadRequestSeqRef = useRef(0);
  const previousActivePhoneRef = useRef("");
  const previousThreadMessageCountRef = useRef(0);

  useEffect(() => {
    activePhoneRef.current = activePhone;
  }, [activePhone]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const activeSummary = useMemo(
    () => conversations.find((conversation) => conversation.phone === activePhone),
    [activePhone, conversations]
  );
  const callsByPhone = useMemo(() => {
    const map = new Map();
    [...incomingCalls, activeCall].filter(Boolean).forEach((call) => {
      map.set(call.phone, call);
    });
    return map;
  }, [activeCall, incomingCalls]);
  const openChatsCount = useMemo(
    () => conversations.filter((conversation) => conversation.status !== "closed").length,
    [conversations]
  );
  const unreadChatsCount = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unreadForAgent || 0), 0),
    [conversations]
  );

  const formatCallSeconds = useCallback((seconds = 0) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }, []);

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) return;
    callStartedAtRef.current = Date.now();
    callTimerRef.current = window.setInterval(() => {
      setCallElapsed((current) => current + 1);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const scrollThreadToBottom = useCallback((animated = false) => {
    const container = messagesScrollRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: animated ? "smooth" : "auto",
      });
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        setThreadReady(true);
      }, 0);
    });
  }, []);

  const markCallConnected = useCallback(() => {
    if (callConnectedRef.current) return;
    callConnectedRef.current = true;
    setCallStatusText("On call");
    startCallTimer();
  }, [startCallTimer]);

  const uploadCallRecording = useCallback(
    async (call, blob, mimeType) => {
      if (!call?.callId) {
        throw new Error("Missing call id for recording upload");
      }
      if (!blob) {
        throw new Error("Recording blob was not created");
      }
      if (blob.size < 1024) {
        throw new Error(`Recorded audio is too small to save (${blob.size} bytes)`);
      }

      const formData = new FormData();
      const durationMs = callStartedAtRef.current ? Math.max(0, Date.now() - callStartedAtRef.current) : 0;
      formData.append("file", blob, `call-recording-${call.callId}.webm`);
      formData.append("name", `call-recording-${call.callId}.webm`);
      formData.append("mimeType", mimeType || "audio/webm");
      formData.append("durationMs", String(durationMs));
      const res = await fetch(`${HUMAN_CALLS_URL}/${call.callId}/recording`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save call recording");
      if (data.call?.phone && data.call?.recordingUrl) {
        setRecordedCallsByPhone((current) => {
          const next = new Map(current);
          next.set(data.call.phone, data.call);
          return next;
        });
      }
    },
    []
  );

  const startCallRecording = useCallback(
    async ({ call, localTrack, remoteTrack }) => {
      if (mediaRecorderRef.current || !call || !localTrack || !remoteTrack || typeof MediaRecorder === "undefined") {
        if (typeof MediaRecorder === "undefined") {
          throw new Error("This browser does not support call recording");
        }
        return;
      }

      const localMediaTrack = localTrack.getMediaStreamTrack?.();
      const remoteMediaTrack = remoteTrack.getMediaStreamTrack?.();
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!localMediaTrack || !remoteMediaTrack || !AudioContextCtor) {
        throw new Error("Call recording stream could not be created");
      }

      const audioContext = new AudioContextCtor();
      const destination = audioContext.createMediaStreamDestination();
      audioContext.createMediaStreamSource(new MediaStream([localMediaTrack])).connect(destination);
      audioContext.createMediaStreamSource(new MediaStream([remoteMediaTrack])).connect(destination);

      const preferredMimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (value) => MediaRecorder.isTypeSupported?.(value)
      );
      const recorder = preferredMimeType
        ? new MediaRecorder(destination.stream, { mimeType: preferredMimeType })
        : new MediaRecorder(destination.stream);

      recordingAudioContextRef.current = audioContext;
      recordingCallRef.current = call;
      recordingChunksRef.current = [];
      recordingMimeTypeRef.current = recorder.mimeType || preferredMimeType || "audio/webm";

      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = recordingChunksRef.current;
        const callForUpload = recordingCallRef.current;
        const mimeType = recordingMimeTypeRef.current;
        recordingChunksRef.current = [];
        recordingMimeTypeRef.current = "";
        mediaRecorderRef.current = null;
        recordingCallRef.current = null;
        if (recordingAudioContextRef.current) {
          recordingAudioContextRef.current.close().catch(() => {});
        }
        recordingAudioContextRef.current = null;

        recordingUploadPromiseRef.current = (async () => {
          if (!chunks.length) {
            throw new Error("No recorded audio was captured for this call");
          }
          if (!callForUpload) {
            throw new Error("Recording ended without an active call reference");
          }

          const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
          await uploadCallRecording(callForUpload, blob, mimeType);
        })()
          .catch((error) => {
            console.error("call recording upload failed:", error);
            setError(error.message || "Failed to save call recording");
            throw error;
          })
          .finally(() => {
            recordingUploadPromiseRef.current = null;
          });
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
    },
    [uploadCallRecording]
  );

  const ensureCallRecordingStarted = useCallback(
    (call) => {
      if (!call || mediaRecorderRef.current) return;
      const localTrack = localAudioTrackRef.current;
      const remoteTrack = remoteAudioTrackRef.current;
      if (!localTrack || !remoteTrack) return;
      startCallRecording({ call, localTrack, remoteTrack }).catch((error) => {
        console.error("call recording start failed:", error);
        setError(error.message || "Failed to start call recording");
      });
    },
    [startCallRecording]
  );

  const stopCallRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise((resolve) => {
        recorder.addEventListener("stop", resolve, { once: true });
        recorder.stop();
      });
      await Promise.resolve();
      if (recordingUploadPromiseRef.current) {
        await recordingUploadPromiseRef.current;
      }
      return;
    }

    mediaRecorderRef.current = null;
    recordingChunksRef.current = [];
    recordingMimeTypeRef.current = "";
    recordingCallRef.current = null;
    recordingUploadPromiseRef.current = null;
    if (recordingAudioContextRef.current) {
      try {
        await recordingAudioContextRef.current.close();
      } catch {
        // ignore
      }
      recordingAudioContextRef.current = null;
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chats");
      setConversations(data.conversations || []);
      setActivePhone((current) => {
        if (current) return current;
        const first = data.conversations?.[0];
        if (first) setActiveConversation(conversationShell(first));
        return first?.phone || "";
      });
    } catch (err) {
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchHumanCalls = useCallback(async () => {
    try {
      const res = await fetch(HUMAN_CALLS_URL);
      const data = await res.json();
      if (!res.ok) return;
      setIncomingCalls((data.calls || []).filter((call) => call.status === "pending"));
    } catch {
      // ignore silently; realtime covers the primary path
    }
  }, []);

  const fetchRecordedCalls = useCallback(async () => {
    try {
      const res = await fetch(`${HUMAN_CALLS_URL}?includeHistory=true`);
      const data = await res.json();
      if (!res.ok) return;
      const next = new Map();
      for (const call of data.calls || []) {
        if (!call.phone || !call.recordingUrl) continue;
        const current = next.get(call.phone);
        const currentTime = new Date(current?.recordingSavedAt || current?.endedAt || 0).getTime();
        const nextTime = new Date(call.recordingSavedAt || call.endedAt || 0).getTime();
        if (!current || nextTime >= currentTime) {
          next.set(call.phone, call);
        }
      }
      setRecordedCallsByPhone(next);
    } catch {
      // ignore silently
    }
  }, []);

  useEffect(() => {
    fetchHumanCalls();
  }, [fetchHumanCalls]);

  useEffect(() => {
    fetchRecordedCalls();
  }, [fetchRecordedCalls]);

  useEffect(() => {
    if (!activePhone) {
      setActiveConversation(null);
      return;
    }

    const cached = threadCacheRef.current.get(activePhone);
    if (cached) setActiveConversation(cached);
    setThreadReady(false);

    threadAbortRef.current?.abort();
    const controller = new AbortController();
    threadAbortRef.current = controller;
    const requestSeq = threadRequestSeqRef.current + 1;
    threadRequestSeqRef.current = requestSeq;

    const shouldFetch = !cached || !cached.messages?.length;
    const loadThread = async () => {
      try {
        setThreadLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load conversation");
        if (controller.signal.aborted || requestSeq !== threadRequestSeqRef.current) return;
        threadCacheRef.current.set(activePhone, data.conversation);
        setActiveConversation(data.conversation);
        setConversations((current) => upsertConversation(current, data.conversation));
        fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readerType: "agent" }),
        }).catch(() => {});
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load conversation");
      } finally {
        if (!controller.signal.aborted) setThreadLoading(false);
      }
    };

    if (shouldFetch) {
      loadThread();
    } else {
      setThreadLoading(false);
      fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerType: "agent" }),
      }).catch(() => {});
    }

    return () => controller.abort();
  }, [activePhone]);

  useEffect(() => {
    if (!activePhone || connected) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}`);
        const data = await res.json();
        if (!res.ok) return;
        setActiveConversation(data.conversation);
        setConversations((current) => upsertConversation(current, data.conversation));
      } catch {
        // WebSocket is primary; polling silently covers transient socket drops.
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activePhone, connected]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    const nextPhone = activePhone || "";
    const nextCount = activeConversation?.messages?.length || 0;
    const changedThread = previousActivePhoneRef.current !== nextPhone;
    const shouldAnimate = !changedThread && nextCount > previousThreadMessageCountRef.current;

    previousActivePhoneRef.current = nextPhone;
    previousThreadMessageCountRef.current = nextCount;
    if (changedThread || nextCount <= 1) setThreadReady(false);
    scrollThreadToBottom(shouldAnimate);
  }, [activeConversation?.messages?.length, activePhone, scrollThreadToBottom]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const cleanupAgentCall = useCallback(async () => {
    stopCallTimer();
    setCallElapsed(0);
    setIsCallMuted(false);
    callStartedAtRef.current = 0;
    callConnectedRef.current = false;
    audioQualityModeRef.current = "high";
    weakNetworkStreakRef.current = 0;
    strongNetworkStreakRef.current = 0;

    await stopCallRecording();

    try {
      localAudioTrackRef.current?.close?.();
    } catch {
      // ignore
    }
    localAudioTrackRef.current = null;
    remoteAudioTrackRef.current = null;

    try {
      await agoraClientRef.current?.leave?.();
    } catch {
      // ignore
    }
    agoraClientRef.current = null;
  }, [stopCallRecording, stopCallTimer]);

  useEffect(() => {
    const ws = new WebSocket(`${getWsUrl()}/ws/chat?role=agent`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "call:incoming") {
        setIncomingCalls((current) => {
          const next = current.filter((call) => call.callId !== payload.call?.callId);
          return payload.call ? [payload.call, ...next] : next;
        });
        return;
      }
      if (payload.type === "conversation:deleted") {
        setConversations((current) => {
          const next = removeConversationByPhone(current, payload.phone);
          if (activePhoneRef.current === payload.phone) {
            setActiveConversation(conversationShell(next[0]));
            setActivePhone(next[0]?.phone || "");
          }
          return next;
        });
        threadCacheRef.current.delete(payload.phone);
        setActiveConversation((current) => current?.phone === payload.phone ? null : current);
        return;
      }
      if (payload.type === "call:accepted" || payload.type === "call:ended" || payload.type === "call:declined") {
        setIncomingCalls((current) =>
          current.filter((call) => call.callId !== payload.call?.callId)
        );
        if ((payload.type === "call:ended" || payload.type === "call:declined") && activeCallRef.current?.callId === payload.call?.callId) {
          cleanupAgentCall().catch(() => {});
          setActiveCall(null);
          setCallStatusText(payload.type === "call:declined" ? "Call declined" : "Call ended");
          setCallElapsed(0);
        }
        return;
      }
      if (payload.type !== "conversation:update") return;

      setConversations((current) => upsertConversation(current, payload.conversation));
      threadCacheRef.current.set(payload.conversation.phone, payload.conversation);
      setActiveConversation((current) =>
        current?.phone === payload.conversation.phone ? payload.conversation : current
      );
      setActivePhone((current) => current || payload.conversation.phone);
    };

    return () => ws.close();
  }, [cleanupAgentCall]);

  useEffect(() => () => {
    cleanupAgentCall().catch(() => {});
  }, [cleanupAgentCall]);

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      auth: { role: "agent" },
      transports: ["polling"],
      upgrade: false,
    });

    socket.on("call:connected", () => setConnected(true));
    socket.on("connect_error", () => setConnected(false));
    socket.on("disconnect", () => setConnected(false));
    socket.on("call:incoming", (payload = {}) => {
      setIncomingCalls((current) => {
        const next = current.filter((call) => call.callId !== payload.call?.callId);
        return payload.call ? [payload.call, ...next] : next;
      });
    });
    socket.on("call:accepted", (payload = {}) => {
      setIncomingCalls((current) => current.filter((call) => call.callId !== payload.call?.callId));
    });
    socket.on("call:ended", (payload = {}) => {
      setIncomingCalls((current) => current.filter((call) => call.callId !== payload.call?.callId));
      if (activeCallRef.current?.callId === payload.call?.callId) {
        cleanupAgentCall().catch(() => {});
        activeCallRef.current = null;
        setActiveCall(null);
        setCallStatusText("Call ended");
        setCallElapsed(0);
      }
    });
    socket.on("call:declined", (payload = {}) => {
      setIncomingCalls((current) => current.filter((call) => call.callId !== payload.call?.callId));
      if (activeCallRef.current?.callId === payload.call?.callId) {
        cleanupAgentCall().catch(() => {});
        activeCallRef.current = null;
        setActiveCall(null);
        setCallStatusText("Call declined");
        setCallElapsed(0);
      }
    });
    socket.on("call:missed", (payload = {}) => {
      setIncomingCalls((current) => current.filter((call) => call.callId !== payload.call?.callId));
    });

    return () => socket.disconnect();
  }, [cleanupAgentCall]);

  const ensureAgoraModule = useCallback(async () => {
    if (agoraModuleRef.current) return agoraModuleRef.current;
    const mod = await import("agora-rtc-sdk-ng");
    agoraModuleRef.current = mod.default || mod;
    return agoraModuleRef.current;
  }, []);

  const switchAgentAudioQuality = useCallback(async (nextMode) => {
    if (audioQualityModeRef.current === nextMode) return;
    const client = agoraClientRef.current;
    const currentTrack = localAudioTrackRef.current;
    if (!client || !currentTrack) return;

    const AgoraRTC = await ensureAgoraModule();
    const nextEncoderConfig = nextMode === "standard" ? "music_standard" : "high_quality";
    const nextTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: nextEncoderConfig,
    });

    try {
      await client.unpublish([currentTrack]);
      await client.publish([nextTrack]);
      currentTrack.close?.();
      localAudioTrackRef.current = nextTrack;
      audioQualityModeRef.current = nextMode;
      console.log("Agora dashboard audio quality ->", nextMode);
    } catch (error) {
      nextTrack.close?.();
      throw error;
    }
  }, [ensureAgoraModule]);

  const handleAgentNetworkQuality = useCallback(async (stats = {}) => {
    const uplink = Number(stats.uplinkNetworkQuality || 0);
    const downlink = Number(stats.downlinkNetworkQuality || 0);
    const worst = Math.max(uplink, downlink);
    const weak = worst >= 4;
    const strong = worst > 0 && worst <= 2;

    weakNetworkStreakRef.current = weak ? weakNetworkStreakRef.current + 1 : 0;
    strongNetworkStreakRef.current = strong ? strongNetworkStreakRef.current + 1 : 0;

    try {
      if (weakNetworkStreakRef.current >= 2) {
        strongNetworkStreakRef.current = 0;
        await switchAgentAudioQuality("standard");
        return;
      }

      if (strongNetworkStreakRef.current >= 3) {
        weakNetworkStreakRef.current = 0;
        await switchAgentAudioQuality("high");
      }
    } catch (error) {
      console.warn("dashboard audio quality switch failed", error);
    }
  }, [switchAgentAudioQuality]);

  const acceptHumanCall = async (call) => {
    if (!call?.callId || callAction.callId === call.callId) return;
    try {
      setCallAction({ callId: call.callId, type: "accept" });
      setError("");
      setCallStatusText("Joining call…");
      await cleanupAgentCall();
      const AgoraRTC = await ensureAgoraModule();
      const res = await fetch(`${HUMAN_CALLS_URL}/${call.callId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "Health Expert" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept call");

      setActiveCall(data.call);
      activeCallRef.current = data.call;
      callConnectedRef.current = false;
      setIncomingCalls((current) => current.filter((item) => item.callId !== call.callId));
      setCallElapsed(0);
      setCallStatusText("Connecting customer…");
      audioQualityModeRef.current = "high";
      weakNetworkStreakRef.current = 0;
      strongNetworkStreakRef.current = 0;

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      agoraClientRef.current = client;
      const subscribeRemoteAudio = async (user) => {
        if (!user) return;
        try {
          await client.subscribe(user, "audio");
          remoteAudioTrackRef.current = user.audioTrack || null;
          if (user.audioTrack) {
            user.audioTrack.setVolume?.(100);
            user.audioTrack.play();
            markCallConnected();
            ensureCallRecordingStarted(data.call);
          }
        } catch (error) {
          console.warn("remote audio subscribe failed", error);
        }
      };
      client.on("user-joined", (user) => {
        if (user?.uid) markCallConnected();
      });
      client.on("user-published", async (user, mediaType) => {
        if (mediaType === "audio") {
          await subscribeRemoteAudio(user);
        } else {
          await client.subscribe(user, mediaType);
          markCallConnected();
        }
      });
      client.on("user-left", () => {
        setCallStatusText("Customer left");
      });
      client.on("network-quality", (stats) => {
        handleAgentNetworkQuality(stats);
      });

      await client.join(data.appId, data.channelName, data.token, data.uid);
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "high_quality",
      });
      localAudioTrackRef.current = localAudioTrack;
      await client.publish([localAudioTrack]);
      await Promise.all((client.remoteUsers || []).map((user) => subscribeRemoteAudio(user)));
      ensureCallRecordingStarted(data.call);
      if (client.remoteUsers?.some((user) => user && user.uid)) {
        markCallConnected();
      } else {
        setCallStatusText("Waiting for customer…");
      }
    } catch (err) {
      setError(err.message || "Failed to join call");
      await cleanupAgentCall();
      activeCallRef.current = null;
      setActiveCall(null);
      setCallStatusText("");
    } finally {
      setCallAction((current) => (current.callId === call?.callId ? { callId: "", type: "" } : current));
    }
  };

  const declineHumanCall = async (call) => {
    if (!call?.callId || callAction.callId === call.callId) return;
    try {
      setCallAction({ callId: call.callId, type: "decline" });
      setError("");
      const res = await fetch(`${HUMAN_CALLS_URL}/${call.callId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "Health Expert" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decline call");
      setIncomingCalls((current) => current.filter((item) => item.callId !== call.callId));
      if (activeCall?.callId === call.callId) {
        await cleanupAgentCall();
        activeCallRef.current = null;
        setActiveCall(null);
        setCallStatusText("");
      }
    } catch (err) {
      setError(err.message || "Failed to decline call");
    } finally {
      setCallAction((current) => (current.callId === call?.callId ? { callId: "", type: "" } : current));
    }
  };

  const endActiveCall = async () => {
    const call = activeCall;
    await cleanupAgentCall();
    activeCallRef.current = null;
    setActiveCall(null);
    setCallStatusText("");
    if (call?.callId) {
      fetch(`${HUMAN_CALLS_URL}/${call.callId}/end`, { method: "POST" }).catch(() => {});
    }
  };

  const toggleCallMute = async () => {
    const track = localAudioTrackRef.current;
    if (!track) return;
    const next = !isCallMuted;
    setIsCallMuted(next);
    try {
      await track.setEnabled(!next);
    } catch (err) {
      setError(err.message || "Failed to update microphone");
      setIsCallMuted(!next);
    }
  };

  const sendMessage = async () => {
    const clean = message.trim();
    if ((!clean && !attachments.length) || !activePhone) return;

    setMessage("");
    const outgoingAttachments = attachments;
    setAttachments([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          attachments: outgoingAttachments,
          senderType: "agent",
          senderName: "Muditam Expert",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setActiveConversation(data.conversation);
      setConversations((current) => upsertConversation(current, data.conversation));
    } catch (err) {
      setError(err.message || "Failed to send message");
      setMessage(clean);
      setAttachments(outgoingAttachments);
    }
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    event.target.value = "";
    if (!files.length) return;

    try {
      const next = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          reject(new Error("Each attachment must be under 1.5 MB"));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUri = reader.result;
          const baseAttachment = {
            type: file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("video/")
                ? "video"
                : file.type.startsWith("audio/")
                  ? "audio"
                  : "file",
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            dataUri,
            width: 0,
            height: 0,
          };

          if (!file.type.startsWith("image/")) {
            resolve(baseAttachment);
            return;
          }

          const image = new Image();
          image.onload = () => resolve({
            ...baseAttachment,
            width: image.naturalWidth || 0,
            height: image.naturalHeight || 0,
          });
          image.onerror = () => resolve(baseAttachment);
          image.src = dataUri;
        };
        reader.onerror = () => reject(new Error("Failed to read attachment"));
        reader.readAsDataURL(file);
      })));

      setAttachments((current) => [...current, ...next].slice(0, 4));
    } catch (err) {
      setError(err.message || "Failed to attach file");
    }
  };

  const renderTicks = (item, mine) => {
    if (!mine) return null;
    const TickIcon = item.readByUser ? DoneAllIcon : DoneIcon;
    return (
      <TickIcon
        sx={{
          ml: 0.25,
          fontSize: 16,
          verticalAlign: "text-bottom",
          color: item.readByUser ? "#6fb7ff" : "rgba(255,255,255,0.78)",
        }}
      />
    );
  };

  const toggleAudio = (attachment, key) => {
    const source = attachmentUrl(attachment);
    if (!source) return;

    if (audioRef.current && playingAudioKey === key) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
        setPlayingAudioKey(key);
      } else {
        audioRef.current.pause();
        setPlayingAudioKey("");
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new window.Audio(source);
    audio.preload = "metadata";
    audioRef.current = audio;
    setPlayingAudioKey(key);
    setAudioProgressMs(0);
    setAudioDurationMs(Number(attachment.durationMs || 0));

    audio.onloadedmetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setAudioDurationMs(Math.round(audio.duration * 1000));
      }
    };
    audio.ontimeupdate = () => {
      setAudioProgressMs(Math.round(audio.currentTime * 1000));
    };
    audio.onpause = () => {
      if (!audio.ended) setPlayingAudioKey("");
    };
    audio.onended = () => {
      setPlayingAudioKey("");
      setAudioProgressMs(0);
      audio.currentTime = 0;
    };

    audio.play().catch(() => {
      setPlayingAudioKey("");
    });
  };

  const playRecordedCall = (call) => {
    if (!call?.recordingUrl) return;
    toggleAudio(
      {
        type: "audio",
        url: call.recordingUrl,
        mimeType: call.recordingMimeType || "audio/webm",
        durationMs: Number(call.recordingDurationMs || 0),
      },
      `recording-${call.callId}`
    );
  };

  const renderAttachment = (attachment, mine) => {
    if (isImageAttachment(attachment)) {
      return (
        <Box
          component="img"
          src={attachmentUrl(attachment)}
          alt={attachment.name || "Attachment"}
          sx={{
            display: "block",
            width: 260,
            maxWidth: "100%",
            maxHeight: 360,
            height: "auto",
            objectFit: "contain",
            borderRadius: 1.5,
            mb: 0.75,
          }}
        />
      );
    }

    if (isAudioAttachment(attachment)) {
      const audioKey = `${attachment.url || attachment.dataUri || attachment.name}-${attachment.createdAt || ""}`;
      const isPlaying = playingAudioKey === audioKey;
      const duration = isPlaying ? (audioDurationMs || attachment.durationMs || 0) : (attachment.durationMs || 0);
      const progressRatio = duration > 0 && isPlaying ? Math.min(1, audioProgressMs / duration) : 0;
      return (
        <Box
          sx={{
            width: 280,
            maxWidth: "100%",
            bgcolor: mine ? "rgba(255,255,255,0.16)" : "#f3f4f6",
            borderRadius: 3,
            px: 1.25,
            py: 1.1,
            mb: 0.75,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.25}>
            <IconButton
              onClick={() => toggleAudio(attachment, audioKey)}
              sx={{
                width: 40,
                height: 40,
                bgcolor: mine ? "rgba(255,255,255,0.16)" : "#ece5fb",
                color: mine ? "#fff" : "#543287",
                flexShrink: 0,
                "&:hover": {
                  bgcolor: mine ? "rgba(255,255,255,0.22)" : "#e1d6f6",
                },
              }}
            >
              {isPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={800} color={mine ? "#fff" : "#111827"} sx={{ mb: 0.6 }}>
                Voice note
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 0.5,
                  mb: 0.75,
                }}
              >
                {Array.from({ length: 18 }).map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 4,
                      height: 10 + ((index % 5) * 4),
                      borderRadius: 999,
                      bgcolor:
                        index / 18 <= progressRatio
                          ? (mine ? "#fff" : "#6f42c1")
                          : (mine ? "rgba(255,255,255,0.26)" : "#d6d6e3"),
                      transition: "background-color 120ms ease",
                    }}
                  />
                ))}
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  fontSize={11}
                  sx={{ color: mine ? "rgba(255,255,255,0.82)" : "#667085", fontWeight: 700 }}
                >
                  {formatDuration(isPlaying ? audioProgressMs : 0)}
                </Typography>
                <Typography
                  fontSize={11}
                  sx={{ color: mine ? "rgba(255,255,255,0.78)" : "#667085", fontWeight: 700 }}
                >
                  {formatDuration(duration)}
                </Typography>
              </Stack>
              <Typography
                fontSize={10}
                sx={{ mt: 0.6, color: mine ? "rgba(255,255,255,0.64)" : "#98a2b3", letterSpacing: 0.2 }}
              >
                Tap to {isPlaying ? "pause" : "play"}
              </Typography>
            </Box>
          </Stack>
        </Box>
      );
    }

    return (
      <Box
        component="a"
        href={attachmentUrl(attachment)}
        download={attachment.name || "attachment"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: 260,
          maxWidth: "100%",
          color: mine ? "#fff" : "#111827",
          bgcolor: mine ? "rgba(255,255,255,0.14)" : "#f3f4f6",
          borderRadius: 1.5,
          px: 1,
          py: 1,
          mb: 0.75,
          textDecoration: "none",
        }}
      >
        <AttachFileIcon fontSize="small" />
        <Typography fontSize={13} fontWeight={700} noWrap>
          {attachment.name || "Attachment"}
        </Typography>
      </Box>
    );
  };

  const updateStatus = async (status) => {
    if (!activePhone) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setActiveConversation(data.conversation);
      setConversations((current) => upsertConversation(current, data.conversation));
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const deleteConversation = async () => {
    if (!activePhone) return;
    const label = activeConversation?.userName || `+91 ${activePhone}`;
    const confirmed = window.confirm(`Delete conversation with ${label}? This will remove the full chat history from the dashboard.`);
    if (!confirmed) return;

    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${activePhone}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete conversation");

      setConversations((current) => {
        const next = removeConversationByPhone(current, activePhone);
        setActiveConversation(conversationShell(next[0]));
        setActivePhone(next[0]?.phone || "");
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to delete conversation");
    }
  };

  const selectConversation = (conversation) => {
    if (!conversation?.phone) return;
    setMessage("");
    setAttachments([]);
    const cached = threadCacheRef.current.get(conversation.phone);
    setActiveConversation(cached || conversationShell(conversation));
    setActivePhone(conversation.phone);
  };

  return (
    <Box
      sx={{
        maxWidth: 1440,
        mx: "auto",
        p: { xs: 0, md: 0.5 },
      }}
    >
      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                background: "linear-gradient(135deg, #0f766e 0%, #543287 55%, #f59e0b 145%)",
                boxShadow: "0 16px 38px rgba(15, 118, 110, 0.24)",
              }}
            >
              <SupportAgentIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={950} color="#101828" letterSpacing={0}>
                Live chats
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Paper
            elevation={0}
            sx={{
              px: 1.6,
              py: 1.1,
              border: "1px solid rgba(15, 118, 110, 0.16)",
              borderRadius: 2,
              minWidth: 118,
              bgcolor: "rgba(255,255,255,0.86)",
              boxShadow: "0 14px 34px rgba(16, 24, 40, 0.07)",
            }}
          >
            <Typography fontSize={11} color="text.secondary" fontWeight={800} textTransform="uppercase">
              Open chats
            </Typography>
            <Typography fontSize={24} lineHeight={1.15} fontWeight={950} color="#0f766e">
              {openChatsCount}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              px: 1.6,
              py: 1.1,
              border: "1px solid rgba(220, 38, 38, 0.14)",
              borderRadius: 2,
              minWidth: 118,
              bgcolor: "rgba(255,255,255,0.86)",
              boxShadow: "0 14px 34px rgba(16, 24, 40, 0.07)",
            }}
          >
            <Typography fontSize={11} color="text.secondary" fontWeight={800} textTransform="uppercase">
              Unread
            </Typography>
            <Typography fontSize={24} lineHeight={1.15} fontWeight={950} color="#dc2626">
              {unreadChatsCount}
            </Typography>
          </Paper>
          <Chip
            size="small"
            color={connected ? "success" : "default"}
            label={connected ? "Realtime on" : "Reconnecting"}
            sx={{
              height: 34,
              fontWeight: 850,
              borderRadius: 999,
              px: 0.5,
              bgcolor: connected ? "#ecfdf3" : "#f2f4f7",
              color: connected ? "#027a48" : "#475467",
              border: "1px solid rgba(16, 24, 40, 0.08)",
            }}
          />
          <IconButton
            onClick={fetchConversations}
            aria-label="Refresh chats"
            sx={{
              width: 38,
              height: 38,
              bgcolor: "#fff",
              border: "1px solid rgba(16, 24, 40, 0.10)",
              boxShadow: "0 10px 24px rgba(16, 24, 40, 0.08)",
              "&:hover": { bgcolor: "#f2f4f7" },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!!incomingCalls.length && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2.25,
            borderRadius: 3,
            border: "1px solid rgba(245, 158, 11, 0.26)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,247,237,0.96) 52%, rgba(236,253,245,0.92) 100%)",
            boxShadow: "0 18px 44px rgba(180, 83, 9, 0.12)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#b45309",
                  color: "#fff",
                  boxShadow: "0 12px 28px rgba(180, 83, 9, 0.22)",
                }}
              >
                <CallRoundedIcon />
              </Box>
              <Box>
                <Typography fontWeight={900} color="#182230">
                  Incoming customer calls
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  Accept on dashboard to connect the customer with a real expert.
                </Typography>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              {incomingCalls.slice(0, 3).map((call) => (
                <Paper
                  key={call.callId}
                  elevation={0}
                  sx={{
                    minWidth: 240,
                    p: 1.35,
                    borderRadius: 2.5,
                    border: "1px solid rgba(180, 83, 9, 0.16)",
                    bgcolor: "rgba(255,255,255,0.92)",
                    boxShadow: "0 12px 26px rgba(16, 24, 40, 0.07)",
                  }}
                >
                  <Typography fontWeight={800} color="#182230">
                    {call.userName || `+91 ${call.phone}`}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }}>
                    {call.userName ? `+91 ${call.phone}` : "Customer"}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.75 }}>
                    Requested {formatTime(call.requestedAt)}
                  </Typography>
                  <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CallRoundedIcon />}
                      onClick={(event) => {
                        event.stopPropagation();
                        acceptHumanCall(call);
                      }}
                      disabled={callAction.callId === call.callId}
                      sx={{
                        borderRadius: 999,
                        bgcolor: "#16a34a",
                        textTransform: "none",
                        fontWeight: 800,
                        "&:hover": { bgcolor: "#15803d" },
                      }}
                    >
                      {callAction.callId === call.callId && callAction.type === "accept" ? "Accepting..." : "Accept"}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CallEndRoundedIcon />}
                      onClick={(event) => {
                        event.stopPropagation();
                        declineHumanCall(call);
                      }}
                      disabled={callAction.callId === call.callId}
                      sx={{
                        borderRadius: 999,
                        bgcolor: "#dc2626",
                        textTransform: "none",
                        fontWeight: 800,
                        "&:hover": { bgcolor: "#b91c1c" },
                      }}
                    >
                      {callAction.callId === call.callId && callAction.type === "decline" ? "Declining..." : "Decline"}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {activeCall && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 1.75,
            borderRadius: 3,
            border: "1px solid rgba(15, 118, 110, 0.20)",
            background: "linear-gradient(135deg, #0f766e 0%, #182230 55%, #543287 100%)",
            color: "#fff",
            boxShadow: "0 20px 48px rgba(15, 118, 110, 0.24)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography fontWeight={900} fontSize={18}>
                {activeCall.userName || `+91 ${activeCall.phone}`}
              </Typography>
              <Typography fontSize={13} sx={{ opacity: 0.82, mt: 0.25 }}>
                {callStatusText || "Connecting…"}
              </Typography>
              <Typography fontSize={24} fontWeight={900} sx={{ mt: 0.75 }}>
                {formatCallSeconds(callElapsed)}
              </Typography>
            </Box>
            <Stack direction="row" gap={1}>
              <IconButton
                onClick={toggleCallMute}
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: isCallMuted ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)",
                  color: "#fff",
                }}
              >
                {isCallMuted ? <MicOffRoundedIcon /> : <MicRoundedIcon />}
              </IconButton>
              <IconButton
                onClick={endActiveCall}
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: "#dc2626",
                  color: "#fff",
                  "&:hover": { bgcolor: "#b91c1c" },
                }}
              >
                <CallEndRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "370px 1fr" },
          gap: 2.25,
          height: { xs: "auto", md: "calc(100vh - 190px)" },
          minHeight: { xs: "auto", md: 560 },
          maxHeight: { xs: "none", md: "calc(100vh - 190px)" },
          overflow: { xs: "visible", md: "hidden" },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(16, 24, 40, 0.10)",
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.74)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 24px 60px rgba(16, 24, 40, 0.10)",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.88) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography fontWeight={900} color="#182230">Conversations</Typography>
            </Box>
            <Chip
              size="small"
              label={`${openChatsCount} open`}
              sx={{ bgcolor: "#ccfbf1", color: "#0f766e", fontWeight: 850, borderRadius: 999 }}
            />
          </Box>
          <Divider sx={{ borderColor: "rgba(16, 24, 40, 0.08)" }} />
          <List
            disablePadding
            sx={{
              flex: 1,
              minHeight: 0,
              height: { xs: 360, md: "auto" },
              overflowY: "auto",
              overflowX: "hidden",
              px: 0.75,
              py: 0.75,
              background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.72))",
            }}
          >
            {!loading && conversations.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">No chats yet.</Typography>
              </Box>
            )}
            {loading && (
              <Box sx={{ p: 2, display: "grid", placeItems: "center" }}>
                <CircularProgress size={24} sx={{ color: "#543287" }} />
              </Box>
            )}
            {conversations.map((conversation) => {
              return (
              <ListItemButton
                key={conversation.phone}
                selected={activePhone === conversation.phone}
                onClick={() => selectConversation(conversation)}
                sx={{
                  alignItems: "flex-start",
                  gap: 1,
                  py: 1.35,
                  px: 1.25,
                  mx: 0,
                  my: 0.65,
                  borderRadius: 2.5,
                  border: activePhone === conversation.phone ? "1px solid rgba(15, 118, 110, 0.28)" : "1px solid rgba(16, 24, 40, 0.06)",
                  borderLeft: activePhone === conversation.phone ? "4px solid #0f766e" : "4px solid transparent",
                  bgcolor: activePhone === conversation.phone ? "#f0fdfa" : "rgba(255,255,255,0.86)",
                  boxShadow: activePhone === conversation.phone
                    ? "0 14px 34px rgba(15, 118, 110, 0.14)"
                    : "0 8px 22px rgba(16, 24, 40, 0.04)",
                  "&.Mui-selected": {
                    bgcolor: "#f0fdfa",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "#ecfdf3",
                  },
                  "&:hover": {
                    bgcolor: "#f8fafc",
                    transform: "translateY(-1px)",
                    boxShadow: "0 14px 32px rgba(16, 24, 40, 0.08)",
                  },
                  transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conversation.unreadForAgent || 0} color="error">
                    <Avatar
                      sx={{
                        bgcolor: activePhone === conversation.phone ? "#0f766e" : "#182230",
                        fontWeight: 900,
                        boxShadow: "0 10px 22px rgba(16, 24, 40, 0.14)",
                      }}
                    >
                      {(conversation.userName || conversation.phone || "?").slice(0, 1).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primaryTypographyProps={{ component: "div" }}
                  secondaryTypographyProps={{ component: "div" }}
                  primary={
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography fontWeight={850} noWrap color="#101828">
                        {conversation.userName || `+91 ${conversation.phone}`}
                      </Typography>
                      <Typography color="text.secondary" fontSize={11.5} fontWeight={750} whiteSpace="nowrap">
                        {formatTime(conversation.lastMessageAt)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack gap={0.5}>
                      <Typography color="#667085" fontSize={13} fontWeight={600} noWrap>
                        {conversation.lastMessage || "New conversation"}
                      </Typography>
                      {callsByPhone.has(conversation.phone) && (
                        <Chip
                          size="small"
                          icon={<CallRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          label={callsByPhone.get(conversation.phone)?.status === "accepted" ? "On call" : "Calling"}
                          sx={{
                            alignSelf: "flex-start",
                            height: 20,
                            borderRadius: 999,
                            bgcolor: "#ecfdf3",
                            color: "#027a48",
                            fontSize: 10,
                            fontWeight: 900,
                            "& .MuiChip-icon": { color: "#027a48", ml: 0.5 },
                          }}
                        />
                      )}
                    </Stack>
                  }
                />
              </ListItemButton>
              );
            })}
          </List>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid rgba(16, 24, 40, 0.10)",
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 24px 60px rgba(16, 24, 40, 0.12)",
            height: "100%",
            minHeight: { xs: 540, md: 0 },
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {!activePhone ? (
            <Box
              sx={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                p: 3,
                background:
                  "linear-gradient(135deg, rgba(240,253,250,0.72), rgba(248,250,252,0.92))",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  border: "1px solid rgba(16, 24, 40, 0.08)",
                  bgcolor: "rgba(255,255,255,0.86)",
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 36, color: "#0f766e", mb: 1 }} />
                <Typography fontWeight={900} color="#101828">Select a chat</Typography>
                <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.5 }}>
                  Pick a conversation from the inbox to start replying.
                </Typography>
              </Paper>
            </Box>
          ) : (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={1.5}
                sx={{
                  px: 2,
                  py: 1.35,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 55%, rgba(240,253,250,0.86) 100%)",
                }}
              >
                <Stack direction="row" alignItems="center" gap={1.25}>
                  <Avatar
                    sx={{
                      bgcolor: "#0f766e",
                      width: 42,
                      height: 42,
                      fontWeight: 900,
                      boxShadow: "0 12px 26px rgba(15, 118, 110, 0.20)",
                    }}
                  >
                    {(activeConversation?.userName || activePhone || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box>
                  <Typography fontWeight={900} color="#101828">{activeConversation?.userName || `+91 ${activePhone}`}</Typography>
                  <Typography color="text.secondary" fontSize={13} fontWeight={650}>
                    {activeConversation?.userName ? `+91 ${activePhone}` : "Customer"}
                  </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={activeSummary?.status === "closed" ? "Closed" : "Open"}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 999,
                      bgcolor: activeSummary?.status === "closed" ? "#f2f4f7" : "#ecfdf3",
                      color: activeSummary?.status === "closed" ? "#475467" : "#027a48",
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CallRoundedIcon />}
                    onClick={(event) => {
                      event.stopPropagation();
                      const call = callsByPhone.get(activePhone);
                      if (call?.status === "pending") acceptHumanCall(call);
                    }}
                    disabled={
                      callsByPhone.get(activePhone)?.status !== "pending" ||
                      !!activeCall ||
                      callAction.callId === callsByPhone.get(activePhone)?.callId
                    }
                    sx={{
                      bgcolor: "#0f766e",
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 2,
                      boxShadow: "0 10px 22px rgba(15, 118, 110, 0.18)",
                      "&:hover": { bgcolor: "#115e59" },
                    }}
                  >
                    {callAction.callId === callsByPhone.get(activePhone)?.callId && callAction.type === "accept"
                      ? "Accepting..."
                      : callsByPhone.get(activePhone)?.status === "pending"
                        ? "Accept call"
                        : "Call"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MarkChatReadIcon />}
                    onClick={() => updateStatus("open")}
                    disabled={activeSummary?.status === "open"}
                  >
                    Open
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => updateStatus("closed")}
                    disabled={activeSummary?.status === "closed"}
                  >
                    Close
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={deleteConversation}
                  >
                    Delete
                  </Button>
                </Stack>
              </Stack>
              <Divider sx={{ borderColor: "rgba(16, 24, 40, 0.08)" }} />

              <Box
                ref={messagesScrollRef}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  p: 2,
                  opacity: threadReady || threadLoading ? 1 : 0,
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(238,242,247,0.98) 100%)",
                  backgroundImage:
                    "radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 30%), radial-gradient(circle at bottom right, rgba(245,158,11,0.10), transparent 28%)",
                }}
              >
                {threadLoading ? (
                  <Box
                    sx={{
                      minHeight: 220,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <CircularProgress size={28} sx={{ color: "#543287" }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      minHeight: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    {(() => {
                  const messages = sortMessagesOldestFirst(activeConversation?.messages || []);
                  let latestEndedCallMessageId = "";
                  for (let index = messages.length - 1; index >= 0; index -= 1) {
                    const candidate = messages[index];
                    if (String(candidate?.text || "").startsWith("Internet call ended")) {
                      latestEndedCallMessageId = candidate._id || candidate.createdAt || `${index}`;
                      break;
                    }
                  }

                  return messages.map((item, index) => {
                  if (isCallEventMessage(item)) {
                    const missed = String(item.text || "").startsWith("Missed") || String(item.text || "").startsWith("Declined");
                    const ended = String(item.text || "").startsWith("Internet call ended");
                    const messageId = item._id || item.createdAt || `${index}`;
                    const recordedCall =
                      ended && messageId === latestEndedCallMessageId && activeConversation?.phone
                        ? recordedCallsByPhone.get(activeConversation.phone)
                        : null;
                    const isRecordedCallPlaying = playingAudioKey === `recording-${recordedCall?.callId}`;
                    return (
                      <Box key={item._id || item.createdAt || `event-${index}`} sx={{ display: "flex", justifyContent: "center", mb: 1.25 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1}
                          sx={{
                            px: 1.25,
                            py: 0.85,
                            borderRadius: 999,
                            bgcolor: "rgba(255,255,255,0.92)",
                            border: "1px solid rgba(16, 24, 40, 0.08)",
                            boxShadow: "0 8px 20px rgba(16, 24, 40, 0.08)",
                            color: missed ? "#b42318" : "#027a48",
                          }}
                        >
                          {missed ? <CallEndRoundedIcon sx={{ fontSize: 17 }} /> : <CallRoundedIcon sx={{ fontSize: 17 }} />}
                          <Typography fontSize={12.5} fontWeight={800}>
                            {item.text}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">
                            {formatTime(item.createdAt)}
                          </Typography>
                          {recordedCall?.recordingUrl && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => playRecordedCall(recordedCall)}
                              startIcon={isRecordedCallPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                              sx={{
                                minWidth: 0,
                                ml: 0.25,
                                px: 0.75,
                                py: 0,
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                textTransform: "none",
                                color: "#543287",
                                bgcolor: "#f3edf9",
                                "&:hover": { bgcolor: "#eadffc" },
                              }}
                            >
                              Listen recording
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    );
                  }
                  const mine = item.senderType === "agent";
                  return (
                    <Box key={item._id || `bubble-${index}`} sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", mb: 1.25 }}>
                      <Box
                        sx={{
                          maxWidth: "72%",
                          bgcolor: mine ? "#0f766e" : "rgba(255,255,255,0.96)",
                          color: mine ? "#fff" : "text.primary",
                          px: 1.35,
                          py: 1.05,
                          borderRadius: 2.5,
                          borderTopRightRadius: mine ? 0.75 : 2.5,
                          borderTopLeftRadius: mine ? 2.5 : 0.75,
                          border: mine ? "1px solid rgba(15, 118, 110, 0.22)" : "1px solid rgba(16, 24, 40, 0.08)",
                          boxShadow: mine
                            ? "0 12px 26px rgba(15, 118, 110, 0.18)"
                            : "0 10px 24px rgba(16, 24, 40, 0.08)",
                        }}
                      >
                        {(item.attachments || []).map((attachment, index) => (
                          <Box key={`${attachment.name}-${index}`}>
                            {renderAttachment(attachment, mine)}
                          </Box>
                        ))}
                        {item.text ? (
                          <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                            {item.text}
                          </Typography>
                        ) : null}
                        <Typography fontSize={11} sx={{ mt: 0.5, opacity: mine ? 0.85 : 0.55, textAlign: "right" }}>
                          {formatTime(item.createdAt)}
                          {renderTicks(item, mine)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                  });
                })()}
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              <Divider sx={{ borderColor: "rgba(16, 24, 40, 0.08)" }} />
              <Box
                sx={{
                  p: 1.5,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
                }}
              >
                {attachments.length > 0 && (
                  <Stack direction="row" gap={1} mb={1} sx={{ overflowX: "auto" }}>
                    {attachments.map((attachment, index) => (
                      <Chip
                        key={`${attachment.name}-${index}`}
                        icon={<AttachFileIcon />}
                        label={attachment.name}
                        onDelete={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        sx={{ maxWidth: 220 }}
                      />
                    ))}
                  </Stack>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={handleFiles}
                />
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Reply to customer"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "#fff",
                      boxShadow: "0 12px 30px rgba(16, 24, 40, 0.08)",
                      "& fieldset": {
                        borderColor: "rgba(16, 24, 40, 0.10)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(15, 118, 110, 0.35)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#0f766e",
                        borderWidth: 1,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Attach file"
                          sx={{
                            color: "#0f766e",
                            bgcolor: "#ecfdf3",
                            "&:hover": { bgcolor: "#ccfbf1" },
                          }}
                        >
                          <AttachFileIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={sendMessage}
                          disabled={!message.trim() && !attachments.length}
                          sx={{
                            bgcolor: message.trim() || attachments.length ? "#0f766e" : "#cbd5e1",
                            color: "#fff",
                            width: 42,
                            height: 42,
                            boxShadow: message.trim() || attachments.length ? "0 12px 24px rgba(15, 118, 110, 0.22)" : "none",
                            "&:hover": { bgcolor: "#115e59" },
                            "&.Mui-disabled": { color: "#fff" },
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
