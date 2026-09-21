import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { loadProductDisplayData, renderStars } from "../../lib/productDisplayData";
import { theme } from "./theme";

const tabs = [
  ["test", "Bot Test", <ScienceOutlinedIcon key="test" />],
  ["source", "Data Source", <StorageOutlinedIcon key="source" />],
  ["addition", "Data Addition", <AddRoundedIcon key="addition" />],
  ["missing", "Missing Info", <DescriptionOutlinedIcon key="missing" />],
  ["discounts", "Discounts", <PercentRoundedIcon key="discounts" />],
];

const cardSx = { border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}px`, bgcolor: theme.surface, boxShadow: theme.shadowSoft };
const primaryButtonSx = { textTransform: "none", borderRadius: `${theme.radiusSmall}px`, fontWeight: 700, bgcolor: theme.accent, "&:hover": { bgcolor: theme.accent } };

function Empty({ children }) {
  return <Box sx={{ py: 7, textAlign: "center", color: theme.muted, fontSize: 14 }}>{children}</Box>;
}

function languageForPreview(message) {
  if (/\p{Script=Devanagari}/u.test(message)) return "hi";
  const phrase = /\b(?:le raha|le rahi|le rahe|kha raha|kha rahi|kha rahe|use kar|start kar|order kar|cart mein|ke liye|isliye|iske liye|uske liye|kya karu|kya lena|kaise lena|kitni baar|safe hai|theek hai|sahi hai|diabetes hai|sugar hai|insulin le|medicine le|dawai le|dawa le)\b/iu;
  if (phrase.test(message)) return "hinglish";
  const signals = message.match(/\b(?:kya|kyu|kyun|kaise|kaisa|kaisi|kaunsi|kaun|hai|hain|hoon|hun|hu|haan|nahi|nahin|mujhe|mera|meri|mere|aap|ap|batao|bataiye|chahiye|karna|karu|karo|lena|leta|leti|sakta|sakti|kitna|kitni|ka|ki|ke|kab|mein|mai|aur|raha|rahi|rahe|wala|wali|liye|abhi|thoda|zyada|jaankari)\b/giu) ?? [];
  const unique = new Set(signals.map((item) => item.toLocaleLowerCase("en-IN")));
  const pronoun = /\b(?:mai|mein|mujhe|mera|meri|mere|aap|ap|ham|hum)\b/iu.test(message);
  const verb = /\b(?:hu|hoon|hun|hai|hain|raha|rahi|rahe|karna|karu|karo|lena|leta|leti|chahiye|sakta|sakti|batao|bataiye)\b/iu.test(message);
  const englishIntent = /\b(?:what|which|how|can|could|would|please|tell|need|want|should|does|is|are|do|have|taking|product|order|price|support|doctor|dietitian)\b/iu.test(message);
  return (pronoun && verb) || unique.size >= 2 || (unique.size === 1 && englishIntent) ? "hinglish" : "en";
}

function WidgetProductCard({ product }) {
  const [display, setDisplay] = useState({ image: null, rating: null });

  useEffect(() => {
    let mounted = true;
    loadProductDisplayData(product.productSlug, product.productUrl).then((data) => {
      if (mounted) setDisplay(data);
    });
    return () => { mounted = false; };
  }, [product.productSlug, product.productUrl]);

  return (
    <Box sx={{
      minWidth: 176,
      overflow: "hidden",
      border: "1px solid #ebe5ee",
      borderRadius: "16px",
      bgcolor: "#fff",
      boxShadow: "0 5px 18px rgb(69 44 80 / 6%)",
    }}>
      <Box component="a" href={product.productUrl} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", flexDirection: "column", color: "#211b27", textDecoration: "none" }}>
        <Box sx={{ display: "grid", placeItems: "center", height: 154, bgcolor: "#fbf9fc", overflow: "hidden" }}>
          {display.image ? (
            <Box component="img" src={display.image} alt={product.name} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <Typography sx={{ color: "#8994a6", fontSize: 12, fontWeight: 750, letterSpacing: ".04em" }}>Muditam</Typography>
          )}
        </Box>
        <Typography sx={{ overflow: "hidden", px: 1.25, pt: 1.1, pb: .25, fontSize: 13, fontWeight: 750, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {product.name}
        </Typography>
        <Stack direction="row" gap={.6} alignItems="center" sx={{ px: 1.25, pb: 1.15, color: "#766d7d", fontSize: 11 }}>
          {display.rating && (
            <>
              <Box component="span" sx={{ color: "#f8c900", fontSize: 12, letterSpacing: 1 }}>{renderStars(display.rating.average)}</Box>
              <Box component="span">{display.rating.average.toFixed(1)} ({display.rating.count})</Box>
            </>
          )}
        </Stack>
      </Box>
      <Button fullWidth disableRipple sx={{
        width: "calc(100% - 20px)",
        mx: 1.25,
        mb: 1.25,
        minHeight: 34,
        border: "1px solid #57316f",
        borderRadius: "10px",
        color: "#57316f",
        bgcolor: "#fff",
        textTransform: "none",
        fontSize: 12,
        fontWeight: 750,
        "&:hover": { bgcolor: "#f7f2f9" },
      }}>
        Add to Cart
      </Button>
    </Box>
  );
}

function WidgetPreviewMessage({ message, recommendedNames = [] }) {
  if (message.role === "products") {
    const count = Math.min(message.products.length, 3);
    return (
      <Box sx={{ position: "relative", mx: -2, mb: 1.5 }}>
        <Box sx={{
          display: "grid",
          gridAutoFlow: count === 1 ? "row" : message.products.length === 2 ? "row" : "column",
          gridTemplateColumns: message.products.length === 2 ? "repeat(2, minmax(0, 1fr))" : count === 1 ? "minmax(0, min(240px, 100%))" : undefined,
          gridAutoColumns: "minmax(176px, 68%)",
          gap: message.products.length === 2 ? 1 : 1.25,
          overflowX: message.products.length > 2 ? "auto" : "hidden",
          px: message.products.length === 2 ? 1.25 : 2,
          py: 1,
          scrollbarWidth: "thin",
        }}>
          {message.products.map((product) => <WidgetProductCard key={product.productSlug} product={product} />)}
        </Box>
      </Box>
    );
  }
  if (message.role === "handoff") {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
        <Button component="a" href={message.handoff.phoneHref} sx={{ minHeight: 44, border: "1px solid #d9cce0", borderRadius: "13px", color: "#57316f", bgcolor: "#fff", textTransform: "none", fontSize: 12, fontWeight: 750 }}>
          Call {message.handoff.phoneDisplay}
        </Button>
        <Button component="a" href={message.handoff.whatsappUrl} target="_blank" rel="noopener noreferrer" sx={{ minHeight: 44, borderRadius: "13px", color: "#fff", bgcolor: "#209d58", textTransform: "none", fontSize: 12, fontWeight: 750, "&:hover": { bgcolor: "#209d58" } }}>
          Chat here
        </Button>
      </Box>
    );
  }

  const isUser = message.role === "user";
  const names = [...new Set(recommendedNames.filter(Boolean))].sort((left, right) => right.length - left.length);
  const pattern = names.length ? new RegExp(`(${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "giu") : null;
  return (
    <Box sx={{
      width: "fit-content",
      maxWidth: "86%",
      ml: isUser ? "auto" : 0,
      mb: 1.25,
      px: 1.75,
      py: 1.35,
      borderRadius: "17px",
      borderBottomLeftRadius: isUser ? "17px" : "6px",
      borderBottomRightRadius: isUser ? "6px" : "17px",
      color: isUser ? "#fff" : "#302637",
      bgcolor: isUser ? undefined : "#f7f4f9",
      background: isUser ? "linear-gradient(145deg, #7d4e99, #70408f)" : undefined,
      boxShadow: isUser ? "0 4px 12px rgb(112 64 143 / 12%)" : "none",
      whiteSpace: "pre-wrap",
      lineHeight: 1.48,
      fontSize: 13.5,
      letterSpacing: "-.005em",
    }}>
      {!pattern || isUser ? message.content : message.content.split(pattern).map((part, index) => (
        names.some((name) => name.toLowerCase() === part.toLowerCase())
          ? <Box key={`${part}-${index}`} component="strong" sx={{ fontWeight: 750 }}>{part}</Box>
          : part
      ))}
    </Box>
  );
}

function BotTest() {
  const ids = useRef({ conversationId: crypto.randomUUID(), visitorId: `preview-${crypto.randomUUID()}` });
  const [messages, setMessages] = useState([{ role: "assistant", content: "How can I help you today? You can ask me about any Muditam product." }]);
  const [recommendedNames, setRecommendedNames] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const send = async (preset) => {
    const text = String(preset ?? input).trim();
    if (!text || loading) return;
    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({ role: item.role, content: item.content }))
      .slice(-20);
    setMessages((old) => [...old, { role: "user", content: text }]);
    setInput(""); setLoading(true);
    try {
      const data = await commerceWidgetApi.testBot({
        ...ids.current,
        language: languageForPreview(text),
        message: text,
        recentMessages: history,
        pageContext: { url: window.location.href, pageType: "other" },
      });
      const names = (data.recommendedProducts ?? []).map((product) => product.name);
      setRecommendedNames(names);
      setMessages((old) => [
        ...old,
        ...data.messages.map((item) => ({ role: "assistant", content: item.text })),
        ...(data.recommendedProducts?.length ? [{ role: "products", products: data.recommendedProducts }] : []),
        ...(data.handoff ? [{ role: "handoff", handoff: data.handoff }] : []),
      ]);
    } catch (error) {
      setMessages((old) => [...old, { role: "assistant", content: "I’m having trouble connecting right now. Please try again in a moment." }]);
    } finally { setLoading(false); }
  };
  const reset = () => { ids.current = { conversationId: crypto.randomUUID(), visitorId: `preview-${crypto.randomUUID()}` }; setRecommendedNames([]); setMessages([{ role: "assistant", content: "How can I help you today? You can ask me about any Muditam product." }]); };
  return <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 760, color: theme.ink }}>Test your bot</Typography>
      <Typography color="text.secondary" sx={{ mt: .5, fontSize: 14 }}>This uses the live knowledge base but is marked as an internal test session.</Typography>
      <Stack spacing={1.1} sx={{ mt: 3, maxWidth: 560 }}>
        {["Suggest something for diabetes", "What can support fatty liver?", "How long does Karela Jamun Fizz take to show results?"].map((item) =>
          <Button key={item} variant="outlined" onClick={() => send(item)} sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: 2, color: theme.ink, borderColor: theme.border, minHeight: 42, px: 1.5, fontSize: 14 }}>{item}</Button>)}
      </Stack>
    </Box>
    <Paper sx={{ flex: "0 0 400px", width: { xs: "100%", md: 400 }, maxWidth: "100%", height: 660, overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr auto", border: "1px solid rgb(112 64 143 / 12%)", borderRadius: "24px", bgcolor: "#fdfcfd", boxShadow: "0 28px 80px rgb(47 31 55 / 12%), 0 4px 18px rgb(47 31 55 / 6%)" }}>
      <Stack direction="row" alignItems="center" gap={1.4} sx={{ px: 2, py: 1.85, borderBottom: "1px solid #ebe5ee", color: "#211b27", bgcolor: "rgb(255 255 255 / 94%)" }}>
        <Box sx={{ display: "grid", width: 38, height: 38, placeItems: "center", borderRadius: "50%", color: "#fff", bgcolor: "#57316f", background: "linear-gradient(145deg, #8457a0, #57316f)", fontFamily: "Georgia, serif", fontSize: 23, fontWeight: 700 }}>m</Box>
        <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: "-.01em" }}>Muditam Expert</Typography><Typography sx={{ mt: .35, color: "#766d7d", fontSize: 10.5 }}><Box component="span" sx={{ display: "inline-block", width: 6, height: 6, mr: .5, borderRadius: "50%", bgcolor: "#38a169" }} />Online · Typically replies instantly</Typography></Box>
        <Button onClick={reset} aria-label="New chat" sx={{ display: "grid", minWidth: 34, width: 34, height: 34, p: 0, borderRadius: "10px", color: "#756d7b", bgcolor: "transparent", fontSize: 23, lineHeight: 1, textTransform: "none", "&:hover": { bgcolor: "#f5f0f8", color: "#57316f" } }}>×</Button>
      </Stack>
      <Box sx={{ overflowY: "auto", px: 2, pt: 2.5, pb: 1.75, bgcolor: "#fdfcfd", scrollbarColor: "#d9cce0 transparent" }}>
        {messages.map((message, index) => <WidgetPreviewMessage key={index} message={message} recommendedNames={recommendedNames} />)}
        {loading && <Box sx={{ display: "inline-flex", alignItems: "center", gap: .65, minWidth: 54, minHeight: 38, px: 1.9, mb: 1.25, borderRadius: "17px", borderBottomLeftRadius: "6px", bgcolor: "#f7f4f9" }}>{[0, 1, 2].map((dot) => <Box key={dot} sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#70408f", opacity: .72 }} />)}</Box>}
      </Box>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); send(); }} sx={{ p: "12px 14px 14px", borderTop: "1px solid #ebe5ee", bgcolor: "#fff" }}>
        <Stack direction="row" gap={1}>
          <Box component="input" maxLength={2000} autoComplete="off" placeholder="Ask about a product…" value={input} onChange={(event) => setInput(event.target.value)} sx={{ minWidth: 0, flex: 1, px: 1.75, py: 1.5, border: "1px solid #ded5e3", borderRadius: "14px", color: "#211b27", bgcolor: "#fbf9fc", outline: "none", fontSize: 14, "&::placeholder": { color: "#a098a5" }, "&:focus": { borderColor: "#a987b9", bgcolor: "#fff", boxShadow: "0 0 0 3px rgb(112 64 143 / 10%)" } }} />
          <IconButton type="submit" disabled={loading} sx={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: "14px", color: "#fff", bgcolor: "#70408f", boxShadow: "0 8px 18px rgb(112 64 143 / 22%)", "&:hover": { bgcolor: "#57316f" }, "&:disabled": { color: "#fff", bgcolor: "#9b7caf", opacity: .75 } }}><SendRoundedIcon sx={{ fontSize: 21 }} /></IconButton>
        </Stack>
        <Typography sx={{ display: "block", mt: .8, color: "#958d9b", fontSize: 10.5 }}>AI can make mistakes. Please verify important information.</Typography>
      </Box>
    </Paper>
  </Stack>;
}

const splitList = (value) => [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];

function EditableProductField({ label, field, editing, setEditing, rows = 3, placeholder }) {
  return <Accordion variant="outlined" disableGutters sx={{ borderRadius: "12px !important", "&:before": { display: "none" } }}>
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography fontWeight={700}>{label}</Typography></AccordionSummary>
    <AccordionDetails><TextField fullWidth multiline minRows={rows} value={editing.fields?.[field] || ""} onChange={(event) => setEditing({ ...editing, fields: { ...(editing.fields || {}), [field]: event.target.value } })} placeholder={placeholder || `Add approved ${label.toLowerCase()} information`} /></AccordionDetails>
  </Accordion>;
}

function ReadOnlyProductField({ label, children }) {
  return <Accordion variant="outlined" disableGutters sx={{ borderRadius: "12px !important", "&:before": { display: "none" } }}>
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography fontWeight={700}>{label}</Typography></AccordionSummary>
    <AccordionDetails><Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{children || "Not available from Shopify"}</Typography></AccordionDetails>
  </Accordion>;
}

function ProductDetailEditor({ editing, setEditing }) {
  const firstVariant = editing.variants?.[0];
  const tags = splitList(editing.tagsText || "");
  const tagRanks = editing.tagRanks || {};
  return <Stack spacing={2.2} sx={{ mt: 1 }}>
    <Stack direction="row" spacing={2} alignItems="center"><Avatar src={editing.imageUrl || undefined} variant="rounded" sx={{ width: 72, height: 72 }}>{editing.name?.[0]}</Avatar><Box><Typography variant="h6" fontWeight={750}>{editing.name}</Typography><Typography color="text.secondary">Product data used by the chatbot</Typography></Box></Stack>
    <Alert severity="info">Editable fields override chatbot knowledge only. Shopify continues to control storefront data, prices, stock, images and variants.</Alert>
    <Typography fontWeight={750}>Editable chatbot fields</Typography>
    <TextField label="Approved description" multiline minRows={4} value={editing.approvedDescription || ""} onChange={(event) => setEditing({ ...editing, approvedDescription: event.target.value })} placeholder={editing.shopify?.description || "Add an approved chatbot description"} />
    <EditableProductField label="Concern" field="concern" editing={editing} setEditing={setEditing} />
    <EditableProductField label="Key benefits" field="keyBenefits" editing={editing} setEditing={setEditing} />
    <EditableProductField label="Quantity" field="quantity" editing={editing} setEditing={setEditing} />
    <EditableProductField label="Usage" field="usage" editing={editing} setEditing={setEditing} placeholder={editing.shopify?.dosage || "Add approved usage information"} />
    <EditableProductField label="Warning / disclaimer" field="warning" editing={editing} setEditing={setEditing} />
    <EditableProductField label="Other" field="other" editing={editing} setEditing={setEditing} />
    <EditableProductField label="Variant formats" field="variantFormats" editing={editing} setEditing={setEditing} />
    {editing.legacyCategory && <Alert severity="info">Legacy system category: <strong>{editing.legacyCategory}</strong>. This is shown for reference only and no longer controls chatbot recommendations.</Alert>}
    <TextField label="Chatbot tags" value={editing.tagsText || ""} onChange={(event) => setEditing({ ...editing, tagsText: event.target.value })} helperText="Only these admin-managed tags control concern-based recommendations." />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <TextField select fullWidth label="Recommendation visibility" value={editing.visible === false ? "hidden" : "visible"} onChange={(event) => setEditing({ ...editing, visible: event.target.value === "visible" })}><MenuItem value="visible">Visible to customers</MenuItem><MenuItem value="hidden">Hidden from recommendations</MenuItem></TextField>
      <TextField fullWidth type="number" label="Overall product order" value={editing.overallRank ?? ""} onChange={(event) => setEditing({ ...editing, overallRank: event.target.value ? Number(event.target.value) : null })} inputProps={{ min: 1, max: 999 }} helperText="Used when customers ask to see all products. 1 appears first." />
    </Stack>
    <Box>
      <Typography fontWeight={750}>Order within each tag</Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 1.5 }}>Set 1 for the first product shown for that concern, 2 for the second, and so on.</Typography>
      {!tags.length ? <Alert severity="info">Add chatbot tags above to configure tag-specific ordering.</Alert> : <Stack spacing={1.2}>{tags.map((tag) => <Stack key={tag} direction="row" spacing={1.5} alignItems="center"><Chip label={tag} sx={{ minWidth: 120, justifyContent: "flex-start" }} /><TextField size="small" type="number" label="Position" value={tagRanks[tag.toLowerCase()] ?? ""} onChange={(event) => setEditing({ ...editing, tagRanks: { ...tagRanks, [tag.toLowerCase()]: event.target.value ? Number(event.target.value) : undefined } })} inputProps={{ min: 1, max: 999 }} sx={{ width: 150 }} /></Stack>)}</Stack>}
    </Box>
    <TextField label="Aliases and common misspellings" value={editing.aliasesText || ""} onChange={(event) => setEditing({ ...editing, aliasesText: event.target.value })} />
    <Divider />
    <Typography fontWeight={750}>Shopify fields — read only</Typography>
    <ReadOnlyProductField label="Shopify ID">{editing.shopify?.productId}</ReadOnlyProductField>
    <ReadOnlyProductField label="URL">{editing.productUrl}</ReadOnlyProductField>
    <ReadOnlyProductField label="Image URL">{editing.imageUrl}</ReadOnlyProductField>
    <ReadOnlyProductField label="Collections">{editing.shopify?.collections?.join(", ")}</ReadOnlyProductField>
    <ReadOnlyProductField label="Published description">{editing.shopify?.description}</ReadOnlyProductField>
    <ReadOnlyProductField label="Published dosage">{editing.shopify?.dosage}</ReadOnlyProductField>
    <ReadOnlyProductField label="Price">{editing.variants?.length ? editing.variants.map((variant) => `${variant.title}: ₹${variant.price}${variant.compareAtPrice ? ` (MRP ₹${variant.compareAtPrice})` : ""}${variant.available ? "" : " — unavailable"}`).join("\n") : ""}</ReadOnlyProductField>
    <ReadOnlyProductField label="Variant ID">{firstVariant?.shopifyVariantId}</ReadOnlyProductField>
    <ReadOnlyProductField label="Add to cart URL">{firstVariant?.shopifyVariantId ? `${editing.productUrl}?variant=${firstVariant.shopifyVariantId}` : ""}</ReadOnlyProductField>
    <ReadOnlyProductField label="Variants">{editing.variants?.length ? JSON.stringify(editing.variants, null, 2) : ""}</ReadOnlyProductField>
  </Stack>;
}

function DataSource({ onAdd }) {
  const [kind, setKind] = useState("products"); const [data, setData] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); const [editing, setEditing] = useState(null); const [saving, setSaving] = useState(false);
  const [bulkTags, setBulkTags] = useState(""); const [bulkPriority, setBulkPriority] = useState("hidden");
  const load = async () => { if (kind === "bulk") { setLoading(false); return; } setLoading(true); setError(""); try { const result = kind === "products" ? await commerceWidgetApi.getBotProducts() : await commerceWidgetApi.getBotKnowledge(); setData(kind === "products" ? result.products : result.sources); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  // Reload when the selected data-source section changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [kind]);
  const filtered = useMemo(() => data.filter((item) => `${item.name ?? item.title} ${item.slug ?? item.content}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const saveProduct = async (product, patch = {}) => { setSaving(true); setError(""); try { const visible = patch.visible ?? product.visible ?? product.recommendationPriority !== "hidden"; const payload = { recommendationPriority: visible ? "normal" : "hidden", visible, overallRank: product.overallRank ?? null, tagRanks: Object.fromEntries(Object.entries(product.tagRanks || {}).filter(([, rank]) => Number.isInteger(rank) && rank > 0)), tags: product.tagsText == null ? (product.tags || []) : splitList(product.tagsText), aliases: product.aliasesText == null ? (product.aliases || []) : splitList(product.aliasesText), approvedDescription: product.approvedDescription || "", fields: { concern: "", keyBenefits: "", quantity: "", usage: "", warning: "", other: "", variantFormats: "", ...(product.fields || {}) }, ...patch }; const result = await commerceWidgetApi.saveBotProduct(product.slug, payload); setData((items) => items.map((item) => item.slug === product.slug ? result.product : item)); setEditing(null); setNotice(`${product.name} settings saved.`); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  const saveKnowledge = async () => { setSaving(true); setError(""); try { const result = await commerceWidgetApi.updateBotKnowledge(editing.key, { title: editing.title, content: editing.content }); setData((items) => items.map((item) => item.key === editing.key ? result.source : item)); setEditing(null); setNotice("Knowledge updated and re-indexed."); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  const deleteKnowledge = async (item) => { if (!window.confirm(`Remove “${item.title}” from the bot knowledge base?`)) return; try { await commerceWidgetApi.deleteBotKnowledge(item.key); setData((items) => items.filter((entry) => entry.key !== item.key)); setNotice("Knowledge removed from chatbot answers."); } catch (e) { setError(e.message); } };
  const applyBulk = async () => { setSaving(true); setError(""); try { const result = await commerceWidgetApi.bulkSaveBotProducts({ tags: splitList(bulkTags), recommendationPriority: bulkPriority }); setNotice(`${result.matched} products updated.`); setBulkTags(""); await load(); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  return <Box><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}><Box><Typography variant="h5" fontWeight={750}>Data source</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Verified information currently available to the chatbot.</Typography></Box><Stack direction="row" spacing={1}><Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load} sx={{ textTransform: "none", borderRadius: 2.5 }}>Refresh</Button>{kind === "knowledge" && <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={onAdd} sx={primaryButtonSx}>Add data</Button>}</Stack></Stack>
    <Tabs value={kind} onChange={(_, value) => setKind(value)} sx={{ mt: 3 }}><Tab value="products" label="Products" /><Tab value="knowledge" label="Non-product data" /><Tab value="bulk" label="Bulk actions" /></Tabs>
    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mt: 2 }}>{notice}</Alert>}
    {kind === "bulk" ? <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 4 }, mt: 3, maxWidth: 820 }}><Stack spacing={2.5}><Box><Typography variant="h6" fontWeight={750}>Show or hide products by tag</Typography><Typography color="text.secondary" fontSize={14} sx={{ mt: .5 }}>Use individual product settings to control overall and tag-specific order.</Typography></Box><TextField label="Product tags" value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} placeholder="diabetes, liver, clearance" helperText="Separate multiple tags with commas." /><TextField select label="Visibility" value={bulkPriority} onChange={(e) => setBulkPriority(e.target.value)}><MenuItem value="hidden">Hidden</MenuItem><MenuItem value="normal">Visible</MenuItem></TextField><Button variant="contained" disabled={saving || !splitList(bulkTags).length} onClick={applyBulk} sx={{ ...primaryButtonSx, alignSelf: "flex-start" }}>{saving ? "Applying..." : "Apply to matching products"}</Button></Stack></Paper> : <>
    <TextField fullWidth placeholder="Search data sources" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ my: 2.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <TableContainer component={Paper} sx={cardSx}><Table><TableHead><TableRow>{kind === "products" ? <><TableCell>Product</TableCell><TableCell>Visibility</TableCell><TableCell>Overall order</TableCell><TableCell>Tags and tag order</TableCell><TableCell align="right">Action</TableCell></> : <><TableCell>Source</TableCell><TableCell>Content</TableCell><TableCell>Managed by</TableCell><TableCell align="right">Action</TableCell></>}</TableRow></TableHead><TableBody>
      {filtered.map((item) => kind === "products" ? <TableRow key={item.slug}><TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar src={item.imageUrl || undefined} variant="rounded">{item.name?.[0]}</Avatar><Box><Stack direction="row" alignItems="center" spacing={.5}><Typography fontWeight={700}>{item.name}</Typography><IconButton size="small" component="a" href={item.productUrl} target="_blank"><OpenInNewRoundedIcon sx={{ fontSize: 15 }} /></IconButton></Stack><Typography fontSize={12} color="text.secondary">{item.slug}</Typography></Box></Stack></TableCell><TableCell><Chip size="small" color={item.visible === false ? "default" : "success"} label={item.visible === false ? "Hidden" : "Visible"} /></TableCell><TableCell><Typography fontWeight={700}>{item.overallRank ?? "—"}</Typography></TableCell><TableCell><Stack direction="row" gap={.7} useFlexGap flexWrap="wrap" sx={{ maxWidth: 420 }}>{item.tags?.length ? item.tags.map((tag) => <Chip key={tag} size="small" variant="outlined" label={`${tag}${item.tagRanks?.[tag.toLowerCase()] ? ` · ${item.tagRanks[tag.toLowerCase()]}` : ""}`} />) : <Typography color="text.secondary">No tags</Typography>}</Stack></TableCell><TableCell align="right"><IconButton onClick={() => setEditing({ type: "product", ...item, tagsText: (item.tags || []).join(", "), aliasesText: (item.aliases || []).join(", ") })}><EditOutlinedIcon /></IconButton></TableCell></TableRow> :
      <TableRow key={item.key}><TableCell><Typography fontWeight={700}>{item.title}</Typography><Typography fontSize={12} color="text.secondary">{item.sourceName}</Typography></TableCell><TableCell><Typography fontSize={13.5} sx={{ maxWidth: 680 }} noWrap>{item.content}</Typography></TableCell><TableCell><Chip size="small" label={item.managedBy === "bot_flow" ? "Dashboard" : "Platform"} /></TableCell><TableCell align="right">{item.managedBy === "bot_flow" && <><IconButton onClick={() => setEditing({ type: "knowledge", ...item })}><EditOutlinedIcon /></IconButton><IconButton color="error" onClick={() => deleteKnowledge(item)}><DeleteOutlineRoundedIcon /></IconButton></>}</TableCell></TableRow>)}
      {!loading && !filtered.length && <TableRow><TableCell colSpan={4}><Empty>No data sources found.</Empty></TableCell></TableRow>}
    </TableBody></Table>{loading && <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box>}</TableContainer></>}
    <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="md"><DialogTitle>{editing?.type === "product" ? "View product details" : "Edit knowledge"}</DialogTitle><DialogContent>{editing?.type === "product" ? <ProductDetailEditor editing={editing} setEditing={setEditing} /> : editing && <Stack spacing={2.2} sx={{ mt: 1 }}><TextField label="Title" required value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /><TextField label="Content" required multiline minRows={10} value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} helperText="Saving will re-index this content for future chatbot answers." /></Stack>}</DialogContent><DialogActions><Button onClick={() => setEditing(null)} disabled={saving}>Close</Button><Button variant="contained" disabled={saving || (editing?.type === "knowledge" && (!editing.title?.trim() || editing.content?.trim().length < 10))} onClick={() => editing?.type === "product" ? saveProduct(editing) : saveKnowledge()} sx={primaryButtonSx}>{saving ? "Saving..." : "Save changes"}</Button></DialogActions></Dialog>
  </Box>;
}

function DataAddition({ initialQuestion = "", onSaved }) {
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(null);
  const save = async () => { setSaving(true); setNotice(null); try { await commerceWidgetApi.addBotKnowledge({ title, content }); setTitle(""); setContent(""); setNotice({ severity: "success", text: "Knowledge saved and indexed for the chatbot." }); onSaved?.(); } catch (e) { setNotice({ severity: "error", text: e.message }); } finally { setSaving(false); } };
  return <Box sx={{ maxWidth: 900, mx: "auto" }}><Typography variant="h5" fontWeight={750}>Add text data</Typography><Typography color="text.secondary" sx={{ mt: .5, mb: 3 }}>Add verified information for the bot to reference in future answers.</Typography>{initialQuestion && <Alert severity="info" sx={{ mb: 2 }}><strong>Customer question:</strong> {initialQuestion}<br />Give this knowledge a reusable descriptive title, then enter the verified answer below.</Alert>}{notice && <Alert severity={notice.severity} sx={{ mb: 2 }}>{notice.text}</Alert>}<Paper sx={{ ...cardSx, p: { xs: 2.5, md: 4 } }}><Stack spacing={2.5}><TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Liver-support product information" /><TextField label="Content" required multiline minRows={9} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter the verified information that the bot should use..." helperText="Keep medical and product claims factual and approved." /><Divider /><Button variant="contained" disabled={saving || title.trim().length < 2 || content.trim().length < 10} onClick={save} sx={{ ...primaryButtonSx, alignSelf: "flex-end", px: 3 }}>{saving ? "Indexing..." : "Save knowledge"}</Button></Stack></Paper><Alert severity="info" sx={{ mt: 2 }}>URL and PDF ingestion will be added after text-data workflows are reviewed.</Alert></Box>;
}

function MissingInfo({ onAdd }) {
  const [questions, setQuestions] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); try { setQuestions((await commerceWidgetApi.getMissingInfo()).questions); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = questions.filter((item) => item.question.toLowerCase().includes(search.toLowerCase()));
  return <Box><Typography variant="h5" fontWeight={750}>Missing information</Typography><Alert severity="info" sx={{ my: 2.5 }}>These are real customer questions where the bot returned a refusal because verified information was unavailable.</Alert><Stack direction="row" spacing={1.5} sx={{ mb: 2 }}><TextField fullWidth placeholder="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} /><IconButton onClick={load}><RefreshRoundedIcon /></IconButton></Stack>{error && <Alert severity="error">{error}</Alert>}<TableContainer component={Paper} sx={cardSx}><Table><TableHead><TableRow><TableCell>Question</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell>{item.question}</TableCell><TableCell><Chip size="small" label={item.category.replaceAll("_", " ")} /></TableCell><TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "—"}</TableCell><TableCell align="right"><Button onClick={() => onAdd(item.question)} sx={{ textTransform: "none" }}>Add answer</Button></TableCell></TableRow>)}{!loading && !filtered.length && <TableRow><TableCell colSpan={4}><Empty>No unresolved questions found.</Empty></TableCell></TableRow>}</TableBody></Table>{loading && <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>}</TableContainer></Box>;
}

function Discounts() {
  const [config, setConfig] = useState({ sharingMode: "disabled", autoUpdate: false, discounts: [] }); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [dialog, setDialog] = useState(false); const [draft, setDraft] = useState({ code: "", description: "", value: "", active: true }); const [notice, setNotice] = useState("");
  useEffect(() => { commerceWidgetApi.getDiscounts().then(setConfig).finally(() => setLoading(false)); }, []);
  const save = async (next = config) => { setSaving(true); try { const saved = await commerceWidgetApi.saveDiscounts(next); setConfig(saved); setNotice("Discount settings saved."); } finally { setSaving(false); } };
  const add = () => { const next = { ...config, discounts: [...config.discounts, { ...draft, id: crypto.randomUUID() }] }; setConfig(next); setDialog(false); setDraft({ code: "", description: "", value: "", active: true }); save(next); };
  if (loading) return <Box sx={{ p: 8, textAlign: "center" }}><CircularProgress /></Box>;
  return <Box><Stack direction="row" justifyContent="space-between"><Box><Typography variant="h5" fontWeight={750}>Discount management</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Control which verified discount codes the bot can share.</Typography></Box><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)} sx={{ textTransform: "none", borderRadius: 2.5 }}>Add discount</Button></Stack>{notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mt: 2 }}>{notice}</Alert>}<Paper sx={{ ...cardSx, p: 3, mt: 3 }}><Typography fontWeight={750}>Discount sharing behaviour</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>{[["relevant", "Relevant only", "Share codes matching the customer’s request."], ["all", "Show all", "List every active saved discount."], ["disabled", "Disabled", "Do not provide discount-specific guidance."]].map(([value, label, description]) => <Paper key={value} variant="outlined" onClick={() => setConfig({ ...config, sharingMode: value })} sx={{ flex: 1, p: 2.2, cursor: "pointer", borderRadius: 3, borderWidth: config.sharingMode === value ? 2 : 1, borderColor: config.sharingMode === value ? theme.accent : theme.border }}><Typography fontWeight={700}>{label}</Typography><Typography fontSize={13} color="text.secondary" sx={{ mt: .5 }}>{description}</Typography></Paper>)}</Stack><Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.border}` }}><Box><Typography fontWeight={700}>Shopify auto-update</Typography><Typography fontSize={13} color="text.secondary">Available after the Shopify Admin API connection is configured.</Typography></Box><Switch disabled checked={false} /></Stack><Button variant="contained" onClick={() => save()} disabled={saving} sx={{ ...primaryButtonSx, mt: 2 }}>{saving ? "Saving..." : "Save settings"}</Button></Paper><Paper sx={{ ...cardSx, mt: 2.5, overflow: "hidden" }}><Table><TableHead><TableRow><TableCell>Code</TableCell><TableCell>Description</TableCell><TableCell>Value</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead><TableBody>{config.discounts.map((item) => <TableRow key={item.id}><TableCell><Typography fontWeight={750}>{item.code}</Typography></TableCell><TableCell>{item.description || "—"}</TableCell><TableCell>{item.value || "—"}</TableCell><TableCell><Chip size="small" color={item.active ? "success" : "default"} label={item.active ? "Active" : "Inactive"} /></TableCell><TableCell align="right"><IconButton onClick={() => { const next = { ...config, discounts: config.discounts.filter((entry) => entry.id !== item.id) }; setConfig(next); save(next); }}><DeleteOutlineRoundedIcon /></IconButton></TableCell></TableRow>)}{!config.discounts.length && <TableRow><TableCell colSpan={5}><Empty>No manual discounts added yet.</Empty></TableCell></TableRow>}</TableBody></Table></Paper><Dialog open={dialog} onClose={() => setDialog(false)} fullWidth maxWidth="sm"><DialogTitle>Add manual discount</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField label="Discount code" required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} /><TextField label="Value" placeholder="Example: 10% off" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} /><TextField label="Description" multiline minRows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="contained" disabled={!draft.code.trim()} onClick={add} sx={primaryButtonSx}>Add discount</Button></DialogActions></Dialog></Box>;
}

function WidgetBotFlow() {
  const [tab, setTab] = useState("test"); const [answerQuestion, setAnswerQuestion] = useState("");
  const openAddition = (question = "") => { setAnswerQuestion(question); setTab("addition"); };
  return <Box sx={{ maxWidth: 1180, mx: "auto", minWidth: 0 }}><Paper sx={{ ...cardSx, mb: 2.5, overflow: "hidden" }}><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: .5, minHeight: 52, "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: theme.accent } }}>{tabs.map(([value, label, icon]) => <Tab key={value} value={value} label={label} icon={icon} iconPosition="start" disableRipple sx={{ minHeight: 52, minWidth: 0, px: { xs: 1.5, md: 2 }, textTransform: "none", fontSize: 13.5, fontWeight: 700, border: 0, bgcolor: "transparent", "& .MuiSvgIcon-root": { fontSize: 20, mr: .7 }, "&.Mui-selected": { color: theme.accent, bgcolor: "transparent" }, "&:focus, &:focus-visible": { outline: "none", bgcolor: "transparent" } }} />)}</Tabs></Paper>
    <Box>{tab === "test" && <BotTest />}{tab === "source" && <DataSource onAdd={() => openAddition()} />}{tab === "addition" && <DataAddition key={answerQuestion} initialQuestion={answerQuestion} />}{tab === "missing" && <MissingInfo onAdd={openAddition} />}{tab === "discounts" && <Discounts />}</Box>
  </Box>;
}

export default WidgetBotFlow;
