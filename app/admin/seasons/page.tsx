'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function SeasonsAdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // New season form state
  const [newSeason, setNewSeason] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: false,
  });

  // Fetch seasons list
  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seasons');
      const data = await response.json();
      
      if (data.seasons) {
        setSeasons(data.seasons);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching seasons:', err);
      setError('Unable to load season data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  // Create new season
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSeason),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Season created successfully (ID: ${data.seasonId})`);
        fetchSeasons();
        // Reset form
        setNewSeason({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: false,
        });
      } else {
        toast.error(`Failed to create season: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating season:', err);
      toast.error('An error occurred while creating the season');
    }
  };

  // Toggle season active state
  const handleToggleActive = async (seasonId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: seasonId,
          isActive: !currentActive,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Season ${!currentActive ? 'activated' : 'deactivated'} successfully`);
        fetchSeasons();
      } else {
        toast.error(`Failed to update season: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating season:', err);
      toast.error('An error occurred while updating the season');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-emerald-50 dark:bg-emerald-950">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-emerald-800 dark:text-emerald-200">Season Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Season creation form */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Create New Season</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Season Name</Label>
                  <Input
                    id="name"
                    value={newSeason.name}
                    onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                    placeholder="e.g. Spring 2024"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSeason.startDate}
                    onChange={(e) => setNewSeason({ ...newSeason, startDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSeason.endDate}
                    onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newSeason.isActive}
                    onCheckedChange={(checked) => setNewSeason({ ...newSeason, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <Button type="submit" className="w-full">Create Season</Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Seasons list */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Seasons List</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : seasons.length === 0 ? (
                <div className="text-center py-4">No seasons found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell className="font-medium">{season.name}</TableCell>
                        <TableCell>
                          {formatDate(season.startDate)} ~ {formatDate(season.endDate)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            season.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {season.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(season.id, season.isActive)}
                          >
                            {season.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 