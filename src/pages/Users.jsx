import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
} from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com');

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/user`)
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, px: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: 24, sm: 34 } }}>
        All Users
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error fetching users: {error}
        </Alert>
      )}

      {!loading && !error && (
        <TableContainer component={Paper} sx={{ mt: 3, maxWidth: "100%", overflowX: "auto" }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Gender</strong></TableCell>
                <TableCell><strong>Year of Birth</strong></TableCell>
                <TableCell><strong>Purchased</strong></TableCell>
                <TableCell><strong>Push Token</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.gender || '-'}</TableCell>
                  <TableCell>{user.yearOfBirth || '-'}</TableCell>
                  <TableCell>{user.hasPurchased ? 'Yes' : 'No'}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-word', maxWidth: 180 }}>
                    {user.expoPushToken || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
