import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { adminApi, ApiError } from "../lib/api";
import { Search, RefreshCw, Users, Calendar, Mail, Phone, MapPin } from "lucide-react";

const AdminCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | name

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomers({ limit: 50 });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    let list = Array.isArray(customers) ? [...customers] : [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q)
        );
      });
    }
    list.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const da = new Date(a.createdAt || a.joinedAt).getTime();
      const db = new Date(b.createdAt || b.joinedAt).getTime();
      return sortBy === "newest" ? db - da : da - db;
    });
    return list;
  }, [customers, search, sortBy]);

  const stats = useMemo(() => {
    const total = customers.length;
    const now = Date.now();
    const THIRTY_D = 30 * 24 * 60 * 60 * 1000;
    const recent = customers.filter((c) =>
      now - new Date(c.createdAt || c.joinedAt).getTime() <= THIRTY_D
    ).length;
    const active = customers.filter(c => c.isActive !== false).length;
    return { total, recent30: recent, active };
  }, [customers]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white lg:ml-64">
      <div className="p-4 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-8 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm lg:text-base text-gray-600">View customer information and activity</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Button variant="outline" size="sm" className="border-gray-300" onClick={fetchCustomers}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Total Customers</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Active Customers</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Joined Last 30 Days</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.recent30}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-sm text-gray-500">Showing</div>
              <div className="text-2xl font-semibold text-gray-900">{filteredCustomers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 px-3 border-gray-300 rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading customers...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer._id} className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                        {customer.name}
                      </h3>

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>

                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                          <span>
                            Joined {new Date(customer.createdAt || customer.joinedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge
                            variant={customer.isActive !== false ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {customer.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                          {customer.role && (
                            <Badge variant="outline" className="text-xs">
                              {customer.role}
                            </Badge>
                          )}
                        </div>

                        {customer.orderCount !== undefined && (
                          <div className="text-xs lg:text-sm text-gray-500 mt-2">
                            {customer.orderCount} orders • ₹{customer.totalSpent?.toLocaleString() || 0} spent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCustomers.length === 0 && (
          <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-8 text-center text-gray-600">
              {customers.length === 0 ? "No customers found." : "No customers match your search."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;