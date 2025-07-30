import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming Shadcn/UI Button
import api from '../api/api';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { AxiosError } from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Log {
  _id: string;
  timestamp: string;
  username: string;
  method: string;
  url: string;
  status: number;
  ip: string;
  responseBody: unknown;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState('all');
  const [usernames, setUsernames] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      const response = await api.get('/user/logs', {
        params: { startDate, endDate, username },
      });
      setLogs(response.data.data);
    } catch (error: unknown) { // Use `unknown` instead of `AxiosError`
      // Type guard to check if error is an AxiosError
      if (error instanceof AxiosError) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch logs',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while fetching logs',
          variant: 'destructive',
        });
      }
    }
  };

  const fetchUsernames = async () => {
    try {
      const response = await api.get('/user/get-all-users');
      const users = response.data.data;
      setUsernames(['all', ...users.map((user: { username: string }) => user.username)]);
    } catch (error: unknown) { // Use `unknown` instead of `AxiosError`
      // Type guard to check if error is an AxiosError
      if (error instanceof AxiosError) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch usernames',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while fetching usernames',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    fetchUsernames();
    fetchLogs();
  }, []);

  const handleSearch = () => {
    fetchLogs();
  };

  return (
    <DashboardLayout>
        <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Activity Logs</h1>
        <div className="bg-background/90 backdrop-blur-md border border-border rounded-2xl p-4 sm:p-6 shadow-md transition-all mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2 h-12 rounded-xl"
                />
            </div>
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2 h-12 rounded-xl"
                />
            </div>
            <div className="relative flex-1">
                <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 pr-4 py-2 h-12 rounded-xl w-full bg-background border border-input"
                >
                {usernames.map((name) => (
                    <option key={name} value={name}>
                    {name}
                    </option>
                ))}
                </select>
            </div>
            <Button
                onClick={handleSearch}
                size="lg"
                className="h-12 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
                <Search className="w-5 h-5" />
                <span>Search</span>
            </Button>
            </div>
        </div>
        {logs.length === 0 ? (
            <div className="text-center py-10">
            <p className="text-muted-foreground">No logs found</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                <tr className="bg-muted">
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">URL</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">IP</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log) => (
                    <tr key={log._id} className="border-b">
                    <td className="p-3">{format(new Date(log.timestamp), 'PPP HH:mm:ss')}</td>
                    <td className="p-3">{log.username}</td>
                    <td className="p-3">{log.method}</td>
                    <td className="p-3">{log.url}</td>
                    <td className="p-3">{log.status}</td>
                    <td className="p-3">{log.ip}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
    </DashboardLayout>
  );
};

export default AdminLogs;