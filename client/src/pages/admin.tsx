import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Star, LogOut, Shield, Plus, UserPlus, Check, X, Clock, Users } from "lucide-react";
import { Review, type AdminUserDb } from "@shared/schema";
import { getAllReviews, updateReview, deleteReview, signInWithEmail, signOut, getSession } from "@/lib/api";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Admin Management Tab Component
function AdminManagementTab({ currentAdminEmail }: { currentAdminEmail: string }) {
  const { toast } = useToast();
  
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery<AdminUserDb[]>({
    queryKey: ["/api/admin/requests/pending"],
    enabled: true,
  });
  
  const { data: allAdmins = [], isLoading: isLoadingAll } = useQuery<AdminUserDb[]>({
    queryKey: ["/api/admin/users"],
    enabled: true,
  });

  const handleApprove = async (id: string) => {
    try {
      const session = await getSession();
      const token = (session as any)?.access_token || 'local-admin-token';
      
      const response = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve");
      }
      
      toast({
        title: "Success",
        description: "Admin request approved. User has been notified.",
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const session = await getSession();
      const token = (session as any)?.access_token || 'local-admin-token';
      
      const response = await fetch(`/api/admin/reject/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject");
      }
      
      toast({
        title: "Success",
        description: "Admin request rejected.",
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <TabsContent value="admin-management" className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Admin Requests
          </CardTitle>
          <CardDescription>
            Review and approve requests for admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPending ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.message || '-'}</TableCell>
                      <TableCell>
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="gap-1"
                            data-testid={`button-approve-${request.id}`}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            className="gap-1"
                            data-testid={`button-reject-${request.id}`}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Administrators
          </CardTitle>
          <CardDescription>
            View all admin users and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        {admin.role === 'super_admin' ? (
                          <Badge variant="default">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(admin.status)}</TableCell>
                      <TableCell>
                        {new Date(admin.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {admin.approvedAt 
                          ? new Date(admin.approvedAt).toLocaleDateString() 
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    async function checkAuth() {
      const session = await getSession();
      if (session) {
        setIsAuthenticated(true);
        const userEmail = session.user?.email || 'godswillpatrick60@gmail.com';
        setCurrentAdminEmail(userEmail);
        
        // Check if super admin
        const response = await fetch("/api/admin/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });
        const data = await response.json();
        if (data.exists && data.role === 'super_admin') {
          setIsSuperAdmin(true);
        }
        
        loadAllReviews();
      }
    }
    checkAuth();
  }, []);

  const loadAllReviews = async () => {
    try {
      const allReviews = await getAllReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await signInWithEmail(email, password);
      setIsAuthenticated(true);
      loadAllReviews();
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setEmail("");
      setPassword("");
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string, postSlug: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReview(reviewId);
      
      // Update state
      setReviews(reviews.filter((r) => r.id !== reviewId));

      toast({
        title: "Review deleted",
        description: "The review has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review.",
        variant: "destructive",
      });
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview({ ...review });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    try {
      await updateReview(editingReview.id, {
        name: editingReview.name,
        rating: editingReview.rating,
        comment: editingReview.comment,
      });

      // Update state
      setReviews(
        reviews.map((r) => (r.id === editingReview.id ? editingReview : r))
      );

      setIsEditDialogOpen(false);
      setEditingReview(null);

      toast({
        title: "Review updated",
        description: "Changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update review.",
        variant: "destructive",
      });
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl" data-testid="text-admin-login-title">
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full"
                data-testid="button-admin-login"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Want to post your own poems?{" "}
                <button
                  onClick={() => setLocation("/admin/signup")}
                  className="text-primary hover:underline font-medium"
                  data-testid="link-register-admin"
                >
                  Request admin access
                </button>
                {" "}to start posting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-display font-bold"
              data-testid="text-admin-dashboard"
            >
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage poems, reviews and moderation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/admin/new-poem")}
              className="gap-2"
              data-testid="button-new-poem"
            >
              <Plus className="h-4 w-4" />
              New Poem
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold mb-1" data-testid="text-total-reviews">
                {reviews.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold mb-1">
                {(
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                ).toFixed(1) || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Average Rating
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold mb-1">
                {
                  reviews.filter(
                    (r) =>
                      new Date(r.created_at).getTime() >
                      Date.now() - 7 * 24 * 60 * 60 * 1000
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="admin-management">
                <Users className="h-4 w-4 mr-2" />
                Admin Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>All Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poem</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No reviews yet
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((review) => (
                      <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                        <TableCell className="font-medium">
                          {review.post_slug}
                        </TableCell>
                        <TableCell>{review.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {review.rating}
                            <Star className="h-4 w-4 fill-primary text-primary" />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {review.comment}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditReview(review)}
                              data-testid={`button-edit-review-${review.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteReview(review.id, review.post_slug)
                              }
                              data-testid={`button-delete-review-${review.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Admin Management Tab */}
          {isSuperAdmin && <AdminManagementTab currentAdminEmail={currentAdminEmail} />}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
              <DialogDescription>
                Make changes to the review below.
              </DialogDescription>
            </DialogHeader>
            {editingReview && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingReview.name}
                    onChange={(e) =>
                      setEditingReview({
                        ...editingReview,
                        name: e.target.value,
                      })
                    }
                    data-testid="input-edit-review-name"
                  />
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setEditingReview({
                            ...editingReview,
                            rating: star,
                          })
                        }
                        className="p-1"
                        data-testid={`button-edit-star-${star}`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= editingReview.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Comment</Label>
                  <Textarea
                    value={editingReview.comment}
                    onChange={(e) =>
                      setEditingReview({
                        ...editingReview,
                        comment: e.target.value,
                      })
                    }
                    rows={4}
                    data-testid="textarea-edit-review-comment"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} data-testid="button-save-edit">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
