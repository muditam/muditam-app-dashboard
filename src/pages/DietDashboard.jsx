import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useNavigate } from 'react-router-dom';
import { dietApi } from '../lib/dietApi';

const goalOptions = [
  '',
  'weightLoss',
  'weightMaintenance',
  'muscleGain',
  'fatShredding',
  'diabetes',
  'pcos',
  'cholesterol',
  'hypertension',
  'thyroid',
  'ibs',
  'kidneyStonesOxalate',
  'pregnancy',
  'lactation',
  'glp1',
  'anemia',
  'osteoporosis',
  'uricAcid',
  'heartDisease',
  'liverDisease',
  'immunityBooster',
  'skinHealth',
  'hairHealth',
];

const healthConditionOptions = [
  { value: 'hypertension', label: 'High blood pressure' },
  { value: 'thyroid', label: 'Hypothyroidism' },
  { value: 'inflammation', label: 'Inflammation' },
  { value: 'proteinDeficiency', label: 'Protein Deficiency' },
  { value: 'vitaminB12Deficiency', label: 'Vitamin B12 Deficiency' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'sleepDisorder', label: 'Sleep disorder' },
  { value: 'prediabetes', label: 'Prediabetes' },
  { value: 'anemia', label: 'Anemia' },
  { value: 'fattyLiver', label: 'Fatty Liver' },
  { value: 'calciumDeficiency', label: 'Calcium Deficiency' },
  { value: 'vitaminDDeficiency', label: 'Vitamin D Deficiency' },
  { value: 'uricAcid', label: 'Uric Acid Problem' },
  { value: 'cholesterol', label: 'High Cholestrol/ Heart' },
  { value: 'ibs', label: 'Digestion / Acidity / Constipation' },
  { value: 'ironDeficiency', label: 'Iron Deficiency' },
];

function formatGoalLabel(value) {
  return String(value || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatHealthConditionLabel(value) {
  if (value === 'heartDisease') value = 'cholesterol';
  if (value === 'liverDisease') value = 'fattyLiver';
  if (value === 'osteoporosis') value = 'calciumDeficiency';
  if (value === 'uricAcidProblem') value = 'uricAcid';
  return healthConditionOptions.find((item) => item.value === value)?.label || formatGoalLabel(value);
}

function formatDietType(value) {
  if (value === 'V') return 'V';
  if (value === 'Ve') return 'Ve';
  if (value === 'NV') return 'NV';
  if (value === 'E') return 'E';
  return '-';
}

function calculateBmi(item) {
  const heightMeters = Number(item?.heightCm || 0) / 100;
  const weightKg = Number(item?.weightKg || 0);
  if (!heightMeters || !weightKg) return 0;
  return weightKg / (heightMeters * heightMeters);
}

function getBmiTone(bmi) {
  if (!bmi) return '#667085';
  if (bmi < 18.5) return '#f59e0b';
  if (bmi < 25) return '#16a34a';
  if (bmi < 30) return '#f59e0b';
  return '#ef4444';
}

function formatPlanDate(item) {
  if (!item?.lastPlanUpdatedAt) return '-';
  const date = new Date(item.lastPlanUpdatedAt);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function DietDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState({ items: [], summary: {} });
  const [error, setError] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [tokenModal, setTokenModal] = useState({ open: false, url: '', clientName: '' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await dietApi.getHealthProfileList({ search, goal });
        if (!cancelled) setData(result);
      } catch (nextError) {
        if (!cancelled) setError(nextError.message || 'Failed to load diet dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [goal, refreshKey, search]);

  const kpis = useMemo(
    () => [
      {
        label: 'Total Clients',
        helper: 'with health profiles',
        value: data.summary?.totalClients || 0,
        tone: '#2563eb',
      },
      {
        label: 'Plans Generated',
        helper: 'clients with active plans',
        value: data.summary?.plansGenerated || 0,
        tone: '#16a34a',
      },
      {
        label: 'Awaiting Plans',
        helper: 'profiles without a plan',
        value: data.summary?.awaitingPlans || 0,
        tone: '#dc2626',
      },
    ],
    [data.summary]
  );

  const rows = useMemo(
    () =>
      (data.items || []).map((item) => {
        const bmi = calculateBmi(item);
        return {
          ...item,
          bmi,
          bmiTone: getBmiTone(bmi),
          lastPlanDateLabel: formatPlanDate(item),
        };
      }),
    [data.items]
  );

  const handleGeneratePlan = async (leadId) => {
    await dietApi.generatePlan({ leadId, generatedBy: 'staff', createdBy: 'staff' });
    setRefreshKey((current) => current + 1);
    navigate(`/diet/editor/${leadId}`);
  };

  const handleGenerateToken = async (item) => {
    const result = await dietApi.generateToken({ leadId: item.leadId, createdBy: 'staff' });
    setTokenModal({ open: true, url: result.onboardingUrl, clientName: item.clientName });
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt('Copy this value', value);
    }
  };

  return (
    <Box sx={{ maxWidth: 1380, mx: 'auto', pb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 3 },
          mb: 3,
          borderRadius: 5,
          border: '1px solid #d9e2f0',
          background: 'linear-gradient(135deg, #f8fbff 0%, #f4f7ff 55%, #eef3ff 100%)',
          boxShadow: '0 18px 48px rgba(16,24,40,0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          gap={2.5}
        >
          <Box sx={{ maxWidth: 760 }}>
            <Typography fontSize={12} fontWeight={900} color="#315efb" letterSpacing={1.6}>
              DIET OPERATIONS
            </Typography>
            <Typography variant="h4" fontWeight={950} color="#1d2939" sx={{ mt: 0.9 }}>
              Diet Plan Dashboard
            </Typography>
            <Typography color="#57708f" sx={{ mt: 0.85, maxWidth: 620 }}>
              Manage client health profiles, regenerate plans when required, and open the weekly editor to refine meal suggestions.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2}>
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => setRefreshKey((current) => current + 1)}
              sx={{
                px: 2.4,
                py: 1.15,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: '#fff',
              }}
            >
              Refresh Dashboard
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setLinkPickerOpen(true)}
              sx={{
                px: 3,
                py: 1.15,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
                boxShadow: 'none',
                bgcolor: '#2962ff',
                '&:hover': { bgcolor: '#1e54e6', boxShadow: 'none' },
              }}
            >
              Generate Onboarding Link
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={3}>
        {kpis.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              flex: 1,
              p: 2.6,
              borderRadius: 4,
              border: '1px solid #d9e2f0',
              boxShadow: '0 12px 32px rgba(16,24,40,0.05)',
              background: 'linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)',
            }}
          >
            <Typography fontSize={12} fontWeight={900} sx={{ color: '#667085', mb: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>
              {item.label}
            </Typography>
            <Typography fontSize={28} fontWeight={950} sx={{ color: item.tone, mb: 0.55 }}>
              {item.value}
            </Typography>
            <Typography fontSize={14} color="#57708f" sx={{ mt: 0.5 }}>
              {item.helper}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4,
          border: '1px solid #d9e2f0',
          mb: 2,
          boxShadow: '0 12px 32px rgba(16,24,40,0.05)',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'center' }} gap={1.5}>
          <TextField
            placeholder="Filter by name or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            sx={{ minWidth: { lg: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#fbfcff' } }}
          />
          <TextField
            select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            size="small"
            sx={{ minWidth: 170, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#fbfcff' } }}
          >
            {goalOptions.map((item) => (
              <MenuItem key={item || 'all-goals'} value={item}>
                {item ? formatGoalLabel(item) : 'All Goals'}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => setRefreshKey((current) => current + 1)}
            sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800 }}
          >
            Refresh
          </Button>
          <Box sx={{ flex: 1 }} />
          <Chip label={`${rows.length} clients`} sx={{ borderRadius: 999, bgcolor: '#eef2ff', color: '#315efb', fontWeight: 900 }} />
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: '1px solid #d9e2f0',
          boxShadow: '0 12px 32px rgba(16,24,40,0.05)',
          overflow: 'hidden',
        }}
      >
        <Table sx={{ minWidth: 1180 }}>
          <TableHead sx={{ bgcolor: '#f8fbff' }}>
            <TableRow>
              {['Client', 'Calorie Target', 'BMI', 'Plans', 'Last Plan', 'Actions'].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    color: '#57708f',
                    fontSize: 13,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    py: 1.4,
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && !rows.length ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 4 }}>
                  <Typography color="#57708f">No health profiles found.</Typography>
                </TableCell>
              </TableRow>
            ) : null}

            {rows.map((item) => (
              <TableRow
                key={item.leadId}
                hover
                sx={{
                  '& td': { py: 2.1, borderBottomColor: '#d9e2f0' },
                  '&:hover': { bgcolor: '#fbfcff' },
                }}
              >
                <TableCell sx={{ minWidth: 320 }}>
                  <Typography fontWeight={900} color="#182230">
                    {item.clientName || 'Unnamed client'}
                  </Typography>
                  <Typography fontSize={13} color="#667085" sx={{ mt: 0.4 }}>
                    {item.clientPhone || item.leadId} · {item.gender || '-'} · {item.age || '-'}y · {formatDietType(item.dietType)}
                  </Typography>
                  <Stack direction="row" gap={0.8} flexWrap="wrap" mt={1.2}>
                    {[item.goal, ...(item.healthConditions || []).slice(0, 2)].filter(Boolean).map((chip) => (
                      <Chip
                        key={`${item.leadId}-${chip}`}
                        label={chip === item.goal ? formatGoalLabel(chip) : formatHealthConditionLabel(chip)}
                        size="small"
                        sx={{
                          height: 24,
                          borderRadius: 999,
                          bgcolor: chip === item.goal ? '#ecf3ff' : '#fff7ed',
                          color: chip === item.goal ? '#2962ff' : '#f59e0b',
                          border: `1px solid ${chip === item.goal ? '#bfd6ff' : '#fed7aa'}`,
                          fontWeight: 800,
                        }}
                      />
                    ))}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={900} color="#182230">
                    {Math.round(item.calorieTarget || 0)}
                  </Typography>
                  <Typography fontSize={13} color="#57708f">
                    kcal / day
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={900} sx={{ color: item.bmiTone }}>
                    {item.bmi ? item.bmi.toFixed(1) : '-'}
                  </Typography>
                  <Typography fontSize={13} color="#57708f">
                    BMI
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={900} color="#182230">
                    {item.planCount || 0}
                  </Typography>
                  <Typography fontSize={13} color="#57708f">
                    plans
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography color="#182230">{item.lastPlanDateLabel}</Typography>
                  <Typography fontSize={13} color="#57708f">
                    {item.awaitingPlan ? 'awaiting plan' : 'last plan'}
                  </Typography>
                </TableCell>

                <TableCell sx={{ minWidth: 235 }}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => navigate(`/diet/editor/${item.leadId}?mode=profile`)}
                      sx={{ textTransform: 'none', borderRadius: 2.2, fontWeight: 800 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<OpenInNewRoundedIcon />}
                      onClick={() => navigate(`/diet/editor/${item.leadId}`)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2.2,
                        boxShadow: 'none',
                        bgcolor: '#2962ff',
                        fontWeight: 800,
                        '&:hover': { bgcolor: '#1e54e6', boxShadow: 'none' },
                      }}
                    >
                      Open Diet Plan
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleGeneratePlan(item.leadId)}
                      startIcon={<AutoAwesomeRoundedIcon />}
                      sx={{ textTransform: 'none', borderRadius: 2.2, fontWeight: 800 }}
                    >
                      Generate
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleGenerateToken(item)}
                      sx={{ minWidth: 40, px: 1.1, borderRadius: 2.2 }}
                    >
                      <LinkRoundedIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => copyText(item.clientPhone || item.leadId)}
                      sx={{ minWidth: 40, px: 1.1, borderRadius: 2.2 }}
                    >
                      <ContentCopyRoundedIcon fontSize="small" />
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={tokenModal.open} onClose={() => setTokenModal({ open: false, url: '', clientName: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Onboarding Link</DialogTitle>
        <DialogContent>
          <Typography color="#57708f" sx={{ mb: 2 }}>
            Share this with {tokenModal.clientName || 'the client'} to collect or update the health profile.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fbff', borderRadius: 2 }}>
            <Typography sx={{ wordBreak: 'break-all' }}>{tokenModal.url}</Typography>
          </Paper>
          <Stack direction="row" justifyContent="flex-end" mt={2}>
            <Button startIcon={<ContentCopyRoundedIcon />} onClick={() => copyText(tokenModal.url)}>
              Copy link
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={linkPickerOpen} onClose={() => setLinkPickerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Onboarding Link</DialogTitle>
        <DialogContent>
          <Typography color="#57708f" sx={{ mb: 2 }}>
            Select a client with a health profile to generate a fresh onboarding link.
          </Typography>
          <TextField
            select
            label="Client"
            value={selectedLeadId}
            onChange={(event) => setSelectedLeadId(event.target.value)}
            fullWidth
          >
            {(rows || []).map((item) => (
              <MenuItem key={item.leadId} value={item.leadId}>
                {item.clientName || 'Unnamed client'} · {item.clientPhone || item.leadId}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" justifyContent="flex-end" gap={1.2} mt={2}>
            <Button onClick={() => setLinkPickerOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!selectedLeadId}
              onClick={async () => {
                const item = rows.find((row) => row.leadId === selectedLeadId);
                if (!item) return;
                await handleGenerateToken(item);
                setLinkPickerOpen(false);
                setSelectedLeadId('');
              }}
            >
              Generate
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
