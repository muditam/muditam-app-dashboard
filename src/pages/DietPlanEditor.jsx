import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { dietApi } from '../lib/dietApi';

const dietTypeOptions = [
  { value: 'V', label: 'Vegetarian' },
  { value: 'Ve', label: 'Vegan' },
  { value: 'NV', label: 'Non-Vegetarian' },
  { value: 'E', label: 'Eggetarian' },
];

const activityOptions = [
  { value: 'AC1', label: 'Sedentary (No Exercise)' },
  { value: 'AC2', label: 'Lightly Active' },
  { value: 'AC3', label: 'Moderately Active' },
  { value: 'AC4', label: 'Very Active' },
];

const goalOptions = [
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

const allergyOptions = [
  { code: 'SF', label: 'Seafood' },
  { code: 'ML', label: 'Milk / Lactose' },
  { code: 'F', label: 'Fruits' },
  { code: 'E', label: 'Eggs' },
  { code: 'N', label: 'Nuts' },
  { code: 'G', label: 'Gluten' },
  { code: 'SO', label: 'Soy' },
];

const communityOptions = [
  { code: 'U', label: 'North India' },
  { code: 'P', label: 'Punjab' },
  { code: 'S', label: 'South India' },
  { code: 'M', label: 'Maharashtra' },
  { code: 'G', label: 'Gujarat' },
  { code: 'B', label: 'Bengali' },
  { code: 'T', label: 'Tamil Nadu' },
  { code: 'R', label: 'Rajasthan' },
  { code: 'K', label: 'Karnataka' },
  { code: 'A', label: 'Andhra Pradesh' },
  { code: 'H', label: 'Haryana' },
  { code: 'O', label: 'Odisha' },
  { code: 'C', label: 'Central India' },
];

function formatGoalLabel(value) {
  return String(value || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDietType(code) {
  return dietTypeOptions.find((item) => item.value === code)?.label || code || '-';
}

function formatActivity(code) {
  return activityOptions.find((item) => item.value === code)?.label || code || '-';
}

function formatCommunity(codes = []) {
  return (codes || [])
    .map((code) => communityOptions.find((item) => item.code === code)?.label || code)
    .join(', ');
}

function getDayLabel(day) {
  const date = new Date();
  date.setDate(date.getDate() + Number(day?.dayIndex || 0));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildProfileDraft(profile) {
  if (!profile) return null;
  return {
    ...profile,
    communityCodes: Array.isArray(profile.communityCodes) ? profile.communityCodes : [],
    healthConditions: Array.isArray(profile.healthConditions) ? profile.healthConditions : [],
    allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
  };
}

function toggleCode(list = [], code) {
  return list.includes(code) ? list.filter((item) => item !== code) : [...list, code];
}

function SectionTagPicker({ title, items, selected, onToggle }) {
  return (
    <Box>
      <Typography fontSize={13} color="#667085" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {items.map((item) => {
          const value = item.code || item;
          const label = item.label || formatGoalLabel(item);
          const active = selected.includes(value);
          return (
            <Chip
              key={value}
              label={label}
              clickable
              onClick={() => onToggle(value)}
              sx={{
                borderRadius: 999,
                fontWeight: 800,
                bgcolor: active ? '#e9edff' : '#fff',
                color: active ? '#295dff' : '#182230',
                border: `1px solid ${active ? '#b6c5ff' : '#d9e2f0'}`,
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

function ProfileDialog({ open, form, onChange, onClose, onSave }) {
  if (!form) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ p: 0, bgcolor: '#f7f8ff' }}>
        <Stack direction="row" justifyContent="flex-end" p={1.25}>
          <IconButton onClick={onClose} sx={{ border: '1px solid #d9e2f0', bgcolor: '#fff' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box sx={{ px: 2, pb: 2 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #d9e2f0', overflow: 'hidden', mb: 2 }}>
            <Box sx={{ px: 2.2, py: 1.8, borderBottom: '1px solid #e5ecf6', bgcolor: '#fff' }}>
              <Typography fontWeight={900} color="#182230">
                Basic Information
              </Typography>
              <Typography fontSize={13} color="#98a2b3" sx={{ mt: 0.4 }}>
                Personal details and body metrics
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
                <TextField label="Name *" value={form.clientName || ''} onChange={(event) => onChange({ ...form, clientName: event.target.value })} fullWidth />
                <TextField label="Age *" type="number" value={form.age || ''} onChange={(event) => onChange({ ...form, age: Number(event.target.value) })} fullWidth />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
                <TextField select label="Gender *" value={form.gender || 'female'} onChange={(event) => onChange({ ...form, gender: event.target.value })} fullWidth>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField select label="Country *" value="India" fullWidth>
                  <MenuItem value="India">India</MenuItem>
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
                <TextField label="Actual Weight *" type="number" value={form.weightKg || ''} onChange={(event) => onChange({ ...form, weightKg: Number(event.target.value) })} fullWidth />
                <TextField label="Desired Weight" type="number" value={form.targetWeightKg || ''} onChange={(event) => onChange({ ...form, targetWeightKg: Number(event.target.value) })} fullWidth />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                <TextField label="Height *" type="number" value={form.heightCm || ''} onChange={(event) => onChange({ ...form, heightCm: Number(event.target.value) })} fullWidth />
                <TextField select label="Community *" value={form.communityCodes?.[0] || 'U'} onChange={(event) => onChange({ ...form, communityCodes: [event.target.value] })} fullWidth>
                  {communityOptions.map((item) => (
                    <MenuItem key={item.code} value={item.code}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #d9e2f0', overflow: 'hidden' }}>
            <Box sx={{ px: 2.2, py: 1.8, borderBottom: '1px solid #e5ecf6', bgcolor: '#fff' }}>
              <Typography fontWeight={900} color="#182230">
                Health &amp; Diet
              </Typography>
              <Typography fontSize={13} color="#98a2b3" sx={{ mt: 0.4 }}>
                Activity, preferences and clinical information
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
                <TextField select label="Activity Level *" value={form.activityCode || 'AC1'} onChange={(event) => onChange({ ...form, activityCode: event.target.value })} fullWidth>
                  {activityOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField select label="Diet Preference *" value={form.dietType || 'V'} onChange={(event) => onChange({ ...form, dietType: event.target.value })} fullWidth>
                  {dietTypeOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
                <TextField select label="Diet Plan Name *" value={form.goal || 'weightLoss'} onChange={(event) => onChange({ ...form, goal: event.target.value })} fullWidth>
                  {goalOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {formatGoalLabel(item)}
                    </MenuItem>
                  ))}
                </TextField>
                <Box sx={{ flex: 1 }}>
                  <SectionTagPicker
                    title="Disorders"
                    items={goalOptions}
                    selected={form.healthConditions || []}
                    onToggle={(value) => onChange({ ...form, healthConditions: toggleCode(form.healthConditions || [], value) })}
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <SectionTagPicker
                title="Allergies"
                items={allergyOptions}
                selected={form.allergies || []}
                onToggle={(value) => onChange({ ...form, allergies: toggleCode(form.allergies || [], value) })}
              />

              <Stack alignItems="center" mt={3}>
                <Button
                  variant="contained"
                  onClick={onSave}
                  sx={{
                    minWidth: 260,
                    py: 1.4,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 900,
                    bgcolor: '#a8b2ff',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#8f9cff', boxShadow: 'none' },
                  }}
                >
                  Update Profile
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function DietPlanEditor() {
  const navigate = useNavigate();
  const { leadId, planId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [searchByCell, setSearchByCell] = useState({});
  const [resultsByCell, setResultsByCell] = useState({});
  const [profileDialogOpen, setProfileDialogOpen] = useState(searchParams.get('mode') === 'profile');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [nextProfile, nextPlans] = await Promise.all([
        dietApi.getHealthProfile(leadId),
        dietApi.getPlansByLead(leadId),
      ]);

      setProfile(nextProfile);
      setProfileDraft(buildProfileDraft(nextProfile));
      setPlans(nextPlans);

      let nextPlan = planId ? nextPlans.find((item) => item._id === planId) : nextPlans.find((item) => item.status === 'active') || nextPlans[0];
      if (!nextPlan) {
        nextPlan = await dietApi.generatePlan({ leadId, generatedBy: 'staff', createdBy: 'staff' });
      } else if (planId && (!nextPlan.planDays || !nextPlan.clientName)) {
        nextPlan = await dietApi.getPlan(planId);
      }

      setPlan(nextPlan);
    } catch (nextError) {
      setError(nextError.message || 'Failed to load diet plan editor');
    } finally {
      setLoading(false);
    }
  }, [leadId, planId]);

  useEffect(() => {
    load();
  }, [load]);

  const previousPlan = useMemo(() => plans.find((item) => item._id !== plan?._id), [plan?._id, plans]);
  const activeSlotIndexes = useMemo(() => {
    const set = new Set();
    (plan?.planDays || []).forEach((day) => {
      (day.slots || []).forEach((slot) => {
        if (slot.isActive) set.add(slot.slotIndex);
      });
    });
    return [...set].sort((a, b) => a - b);
  }, [plan?.planDays]);

  const slotCatalog = useMemo(() => {
    const map = {};
    (plan?.planDays || []).forEach((day) => {
      (day.slots || []).forEach((slot) => {
        if (!map[slot.slotIndex]) map[slot.slotIndex] = slot;
      });
    });
    return map;
  }, [plan?.planDays]);

  const weekRangeLabel = useMemo(() => {
    const days = plan?.planDays || [];
    if (!days.length) return '';
    return `${getDayLabel(days[0])} - ${getDayLabel(days[days.length - 1])}`;
  }, [plan?.planDays]);

  const handleProfileSave = async () => {
    const saved = await dietApi.saveHealthProfile(profileDraft);
    setProfile(saved);
    setProfileDraft(buildProfileDraft(saved));
    setProfileDialogOpen(false);
  };

  const handleSaveWeek = async () => {
    if (!plan?._id) return;
    try {
      setSaving(true);
      const updated = await dietApi.updatePlan(plan._id, {
        planDays: plan.planDays,
        calorieTarget: plan.calorieTarget,
        smartCalorieTarget: plan.smartCalorieTarget,
        notes: plan.notes,
        status: plan.status,
      });
      setPlan(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPreviousWeek = () => {
    if (!previousPlan || !plan) return;
    setPlan({ ...plan, planDays: previousPlan.planDays });
  };

  const handleFoodSearch = async (dayIndex, slotIndex) => {
    const key = `${dayIndex}-${slotIndex}`;
    const query = searchByCell[key];
    const result = await dietApi.searchFoods({
      q: query,
      slotIndex,
      dietType: profile?.dietType,
      communityCodes: profile?.communityCodes,
      healthConditions: profile?.healthConditions,
      allergies: profile?.allergies,
    });
    setResultsByCell((current) => ({ ...current, [key]: result.items || [] }));
  };

  const handleAddFood = async (dayIndex, slotIndex, food) => {
    if (!plan?._id) return;
    const updated = await dietApi.addFood(plan._id, { dayIndex, slotIndex, food });
    setPlan(updated);
  };

  const handleRemoveFood = async (dayIndex, slotIndex, food) => {
    if (!plan?._id) return;
    const updated = await dietApi.removeFood(plan._id, {
      dayIndex,
      slotIndex,
      foodId: food.foodId,
      source: food.source,
    });
    setPlan(updated);
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt('Copy value', value);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-start' }} gap={2} mb={2.2}>
        <Box>
          <Typography fontSize={13} fontWeight={900} color="#11827b" letterSpacing={1.4}>
            DIET PLAN EDITOR
          </Typography>
          <Typography variant="h3" fontWeight={950} lineHeight={1.05} color="#1d2939" sx={{ mt: 0.8, maxWidth: 780 }}>
            Fine-tune the weekly plan for {profile?.clientName || 'Client'}
          </Typography>
          <Typography color="#57708f" sx={{ mt: 1.2 }}>
            Review nutrition targets, refine meal slots, and keep the weekly plan aligned with the client profile.
          </Typography>
        </Box>
        <Chip label={weekRangeLabel} sx={{ borderRadius: 999, bgcolor: '#ecfeff', color: '#0f766e', fontWeight: 900 }} />
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #d9e2f0', overflow: 'hidden', mb: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />}>
          <Box sx={{ p: 2, minWidth: 240 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box>
                <Typography fontWeight={900} color="#3b5bfd">
                  {profile?.clientName || 'Client'}
                </Typography>
                <Typography fontSize={13} color="#667085" sx={{ mt: 0.5 }}>
                  {profile?.age || '-'} yrs, {profile?.clientPhone || leadId}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setProfileDialogOpen(true)} sx={{ color: '#6c7cff' }}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} flexWrap="wrap" sx={{ flex: 1, px: 1.5, py: 1.4 }} gap={2}>
            {[
              ['Weight', `${profile?.weightKg || '-'} kg`],
              ['Height', profile?.heightCm ? `${profile.heightCm} cm` : '-'],
              ['Activity', formatActivity(profile?.activityCode)],
              ['Goal', formatGoalLabel(profile?.goal)],
              ['Food Pref.', formatDietType(profile?.dietType)],
              ['Country', 'India'],
              ['Community', formatCommunity(profile?.communityCodes) || '-'],
              ['Allergy', (profile?.allergies || []).join(', ') || '-'],
              ['Diseases', (profile?.healthConditions || []).map(formatGoalLabel).join(', ') || '-'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ minWidth: 84, flex: '1 1 82px' }}>
                <Typography fontSize={11} color="#6c7cff" sx={{ mb: 0.65 }}>
                  {label}
                </Typography>
                <Typography fontSize={13} fontWeight={900} color="#182230">
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" gap={1.2} sx={{ p: 1.5 }}>
            <TextField
              label="Calories"
              value={plan?.calorieTarget || ''}
              onChange={(event) => setPlan((current) => ({ ...current, calorieTarget: Number(event.target.value) }))}
              size="small"
              sx={{ width: 92 }}
            />
            <Button
              variant="contained"
              onClick={handleSaveWeek}
              disabled={saving}
              sx={{ borderRadius: 999, textTransform: 'none', px: 2.2, fontWeight: 900, bgcolor: '#5e6cff', boxShadow: 'none', '&:hover': { bgcolor: '#4d5de8', boxShadow: 'none' } }}
            >
              Update
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #d9e2f0', mb: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Stack direction="row" alignItems="center" gap={1.2}>
            <IconButton onClick={() => navigate('/')} sx={{ border: '1px solid #d9e2f0', bgcolor: '#fff' }}>
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={950} color="#1d2939">
              Weekly Builder
            </Typography>
            <Button variant="outlined" sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800 }}>
              Copy from template
            </Button>
            <Button
              variant="contained"
              onClick={handleCopyPreviousWeek}
              disabled={!previousPlan}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800, boxShadow: 'none', bgcolor: '#2f66e6', '&:hover': { bgcolor: '#2557c7', boxShadow: 'none' } }}
            >
              Copy previous week
            </Button>
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button
              startIcon={<AutoAwesomeRoundedIcon />}
              variant="outlined"
              onClick={() => dietApi.generatePlan({ leadId, generatedBy: 'staff', createdBy: 'staff' }).then(load)}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800 }}
            >
              Regenerate Plan
            </Button>
            <Button
              startIcon={<ContentCopyRoundedIcon />}
              variant="outlined"
              onClick={() => copyText(profile?.clientPhone || leadId)}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800 }}
            >
              Copy Client
            </Button>
            <Button
              startIcon={<SaveRoundedIcon />}
              variant="contained"
              disabled={saving}
              onClick={handleSaveWeek}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800, boxShadow: 'none', bgcolor: '#182230', '&:hover': { bgcolor: '#101828', boxShadow: 'none' } }}
            >
              Save Week
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 1.75, borderRadius: 4, border: '1px solid #d9e2f0' }}>
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Stack direction="row" gap={1.2} sx={{ minWidth: 1120, mb: 2 }}>
            <Box sx={{ width: 200, flexShrink: 0 }} />
            {(plan?.planDays || []).map((day) => {
              const totals = (day.slots || []).reduce(
                (acc, slot) => {
                  acc.calories += Number(slot.totalCalories || 0);
                  acc.protein += Number(slot.totalProtein || 0);
                  acc.carbs += Number(slot.totalCarbs || 0);
                  acc.fat += Number(slot.totalFat || 0);
                  acc.fiber += Number(slot.totalFiber || 0);
                  return acc;
                },
                { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
              );

              return (
                <Paper
                  key={day.dayIndex}
                  elevation={0}
                  sx={{
                    width: 164,
                    flexShrink: 0,
                    p: 1.1,
                    borderRadius: 3,
                    border: '1px solid #d9e2f0',
                    bgcolor: '#fff',
                  }}
                >
                  <Typography textAlign="center" fontWeight={900} color="#295dff">
                    {day.dayLabel.slice(0, 3)}
                  </Typography>
                  <Typography textAlign="center" fontSize={12} color="#667085" sx={{ mt: 0.4 }}>
                    {getDayLabel(day)}
                  </Typography>
                  <Paper elevation={0} sx={{ mt: 1.2, p: 1.2, borderRadius: 2.5, bgcolor: '#f5f8ff', border: '1px solid #d9e2f0' }}>
                    <Typography textAlign="center" fontWeight={950} color="#295dff" fontSize={18}>
                      {Math.round(totals.calories)} <Box component="span" sx={{ fontSize: 14 }}>kcal</Box>
                    </Typography>
                    <Typography textAlign="center" fontSize={11} color="#667085" sx={{ mt: 0.7, lineHeight: 1.5 }}>
                      Carbs:{Math.round(totals.carbs)}g | Fat:{Math.round(totals.fat)}g
                      <br />
                      Protein:{Math.round(totals.protein)}g | Fiber:{Math.round(totals.fiber)}g
                    </Typography>
                  </Paper>
                </Paper>
              );
            })}
          </Stack>

          <Stack gap={1.5} sx={{ minWidth: 1120 }}>
            {activeSlotIndexes.map((slotIndex) => (
              <Stack key={slotIndex} direction="row" gap={1.2} alignItems="stretch">
                <Paper
                  elevation={0}
                  sx={{
                    width: 200,
                    flexShrink: 0,
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid #d9e2f0',
                    bgcolor: '#fbfdff',
                  }}
                >
                  <Typography fontSize={12} fontWeight={900} color="#11827b">
                    {slotCatalog[slotIndex]?.mealTime}
                  </Typography>
                  <Typography fontSize={18} fontWeight={950} color="#295dff" sx={{ mt: 1.5 }}>
                    {slotCatalog[slotIndex]?.slotName}
                  </Typography>
                  <Typography fontSize={13} color="#667085" sx={{ mt: 1.4, lineHeight: 1.6 }}>
                    Add, remove, or adjust foods for this meal block.
                  </Typography>
                </Paper>

                {(plan?.planDays || []).map((day) => {
                  const slot = (day.slots || []).find((item) => item.slotIndex === slotIndex);
                  const key = `${day.dayIndex}-${slotIndex}`;

                  return (
                    <Paper
                      key={key}
                      elevation={0}
                      sx={{
                        width: 164,
                        flexShrink: 0,
                        p: 1,
                        borderRadius: 3,
                        border: '1px solid #d9e2f0',
                        bgcolor: '#fff',
                      }}
                    >
                      <Stack gap={1}>
                        {(slot?.foods || []).map((food) => (
                          <Paper
                            key={`${key}-${food.source}-${food.foodId}`}
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              border: '1px solid #d9e2f0',
                              bgcolor: '#fff',
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" gap={0.7}>
                              <Typography fontSize={12} fontWeight={900} color="#295dff" sx={{ lineHeight: 1.4 }}>
                                {food.name}
                              </Typography>
                              <Chip
                                label={`${Math.round(food.calories || 0)} kcal`}
                                size="small"
                                sx={{ height: 24, bgcolor: '#ecfeff', color: '#0f766e', fontWeight: 800 }}
                              />
                            </Stack>
                            <Typography fontSize={11} color="#667085" sx={{ mt: 0.7 }}>
                              {food.portion} {food.portionUnit}
                            </Typography>
                            <Typography fontSize={11} color="#667085" sx={{ mt: 0.7 }}>
                              P{Math.round(food.protein || 0)} · C{Math.round(food.carbs || 0)} · F{Math.round(food.fat || 0)}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineRoundedIcon />}
                              onClick={() => handleRemoveFood(day.dayIndex, slotIndex, food)}
                              sx={{ mt: 0.8, textTransform: 'none', fontSize: 11, minWidth: 0, alignSelf: 'flex-end' }}
                            >
                              Remove
                            </Button>
                          </Paper>
                        ))}

                        <TextField
                          size="small"
                          placeholder="Search food"
                          value={searchByCell[key] || ''}
                          onChange={(event) => setSearchByCell((current) => ({ ...current, [key]: event.target.value }))}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => handleFoodSearch(day.dayIndex, slotIndex)}
                          sx={{ borderStyle: 'dashed', textTransform: 'none', fontWeight: 800 }}
                        >
                          + Add Food
                        </Button>

                        {!!resultsByCell[key]?.length && (
                          <Stack gap={0.8}>
                            {resultsByCell[key].slice(0, 4).map((food) => (
                              <Paper key={`${key}-result-${food.source}-${food.foodId}`} elevation={0} sx={{ p: 1, borderRadius: 2, bgcolor: '#f8fbff', border: '1px solid #d9e2f0' }}>
                                <Typography fontSize={12} fontWeight={900} color="#182230">
                                  {food.name}
                                </Typography>
                                <Typography fontSize={11} color="#667085" sx={{ mt: 0.5 }}>
                                  {Math.round(food.calories || 0)} kcal
                                </Typography>
                                <Button size="small" variant="contained" onClick={() => handleAddFood(day.dayIndex, slotIndex, food)} sx={{ mt: 0.8, textTransform: 'none', boxShadow: 'none' }}>
                                  Add
                                </Button>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            ))}
          </Stack>
        </Box>
      </Paper>

      <ProfileDialog
        open={profileDialogOpen}
        form={profileDraft}
        onChange={setProfileDraft}
        onClose={() => setProfileDialogOpen(false)}
        onSave={handleProfileSave}
      />
    </Box>
  );
}
