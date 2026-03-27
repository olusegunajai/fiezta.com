import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Role, UserRole } from '../types';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoleManagerProps {
  agencyId: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_packages', label: 'Manage Travel Packages', description: 'Create, edit, and delete travel packages' },
  { id: 'manage_bookings', label: 'Manage Bookings', description: 'View and process client bookings' },
  { id: 'manage_users', label: 'Manage Users & Staff', description: 'Manage user profiles and staff assignments' },
  { id: 'manage_roles', label: 'Manage Roles & Permissions', description: 'Create and edit user roles' },
  { id: 'manage_themes', label: 'Manage Themes', description: 'Customize application appearance' },
  { id: 'view_audit_logs', label: 'View Audit Logs', description: 'View system security and activity logs' },
  { id: 'manage_coupons', label: 'Manage Coupons', description: 'Create and manage discount codes' },
  { id: 'manage_social', label: 'Manage Social Media', description: 'Schedule and manage social media posts' },
  { id: 'manage_finance', label: 'Manage Finance & Invoices', description: 'Manage invoices and payments' },
  { id: 'manage_content', label: 'Manage Website Content', description: 'Manage vlogs, blog posts, and forms' },
];

const DEFAULT_ROLES = [
  { name: 'admin', description: 'Full system access', permissions: AVAILABLE_PERMISSIONS.map(p => p.id), isSystem: true },
  { name: 'agent', description: 'Travel agent access', permissions: ['manage_packages', 'manage_bookings', 'manage_social', 'manage_content'], isSystem: true },
  { name: 'accountant', description: 'Financial access', permissions: ['manage_finance', 'view_audit_logs'], isSystem: true },
  { name: 'support', description: 'Customer support access', permissions: ['manage_bookings', 'manage_content'], isSystem: true },
  { name: 'client', description: 'Basic client access', permissions: [], isSystem: true },
];

export const RoleManager: React.FC<RoleManagerProps> = ({ agencyId }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) return;

    const q = query(collection(db, 'roles'), where('agencyId', '==', agencyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Role[];
      
      setRoles(rolesData);
      setLoading(false);

      // Seed default roles if none exist
      if (rolesData.length === 0 && !loading) {
        seedDefaultRoles();
      }
    }, (err) => {
      console.error("Error fetching roles:", err);
      setError("Failed to load roles. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agencyId]);

  const seedDefaultRoles = async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_ROLES.forEach((role) => {
        const newRoleRef = doc(collection(db, 'roles'));
        batch.set(newRoleRef, {
          ...role,
          agencyId,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error seeding default roles:", err);
    }
  };

  const handleSaveRole = async () => {
    if (!currentRole?.name || !agencyId) {
      setError("Role name is required");
      return;
    }

    try {
      if (currentRole.id) {
        const roleRef = doc(db, 'roles', currentRole.id);
        await updateDoc(roleRef, {
          ...currentRole,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'roles'), {
          ...currentRole,
          agencyId,
          isSystem: false,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditing(false);
      setCurrentRole(null);
      setError(null);
    } catch (err) {
      console.error("Error saving role:", err);
      setError("Failed to save role. Check permissions.");
    }
  };

  const handleDeleteRole = async (id: string, isSystem?: boolean) => {
    if (isSystem) {
      setError("System roles cannot be deleted");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await deleteDoc(doc(db, 'roles', id));
    } catch (err) {
      console.error("Error deleting role:", err);
      setError("Failed to delete role.");
    }
  };

  const togglePermission = (permissionId: string) => {
    if (!currentRole) return;
    
    const permissions = currentRole.permissions || [];
    if (permissions.includes(permissionId)) {
      setCurrentRole({
        ...currentRole,
        permissions: permissions.filter(p => p !== permissionId)
      });
    } else {
      setCurrentRole({
        ...currentRole,
        permissions: [...permissions, permissionId]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Role Management
          </h2>
          <p className="text-muted-foreground">Define and manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => {
            setCurrentRole({ name: '', description: '', permissions: [] });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            layout
            className="p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                {role.isSystem && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    System
                  </span>
                )}
                <button
                  onClick={() => {
                    setCurrentRole(role);
                    setIsEditing(true);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(role.id, role.isSystem)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold capitalize mb-1">{role.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{role.description || 'No description provided'}</p>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Permissions ({role.permissions.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded-full">
                    {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {currentRole?.id ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentRole(null);
                  }}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Name</label>
                    <input
                      type="text"
                      value={currentRole?.name || ''}
                      onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                      placeholder="e.g. Senior Agent"
                      disabled={currentRole?.isSystem}
                      className="w-full px-4 py-2 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      value={currentRole?.description || ''}
                      onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                      placeholder="Briefly describe this role"
                      className="w-full px-4 py-2 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Permissions</label>
                    <span className="text-xs text-muted-foreground">
                      {currentRole?.permissions?.length || 0} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <button
                        key={permission.id}
                        onClick={() => togglePermission(permission.id)}
                        className={`flex items-start gap-3 p-3 text-left border rounded-xl transition-all ${
                          currentRole?.permissions?.includes(permission.id)
                            ? 'bg-primary/5 border-primary ring-1 ring-primary'
                            : 'bg-muted/50 border-transparent hover:border-muted-foreground/20'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          currentRole?.permissions?.includes(permission.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/30'
                        }`}>
                          {currentRole?.permissions?.includes(permission.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{permission.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            {permission.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentRole(null);
                  }}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {currentRole?.id ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
