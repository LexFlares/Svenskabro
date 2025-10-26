import { supabase } from '@/lib/supabase';

export interface Equipment {
  id: string;
  name: string;
  category: 'tool' | 'vehicle' | 'machinery' | 'safety';
  serialNumber?: string;
  qrCode?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  purchaseDate?: Date;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  userId: string;
  jobId?: string;
  checkedOutAt: Date;
  checkedInAt?: Date;
  conditionAtCheckout?: string;
  conditionAtCheckin?: string;
  notes?: string;
  equipment?: Equipment;
}

export class EquipmentManagementService {
  async getAllEquipment(): Promise<Equipment[]> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .order('name');

    if (!data) return [];

    return data.map(this.mapEquipment);
  }

  async getAvailableEquipment(): Promise<Equipment[]> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('status', 'available')
      .order('name');

    if (!data) return [];

    return data.map(this.mapEquipment);
  }

  async getEquipmentByCategory(category: Equipment['category']): Promise<Equipment[]> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('category', category)
      .order('name');

    if (!data) return [];

    return data.map(this.mapEquipment);
  }

  async getEquipmentById(id: string): Promise<Equipment | null> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    return data ? this.mapEquipment(data) : null;
  }

  async checkoutEquipment(
    equipmentId: string,
    userId: string,
    jobId?: string,
    conditionAtCheckout?: string
  ): Promise<EquipmentAssignment> {
    await supabase
      .from('equipment')
      .update({ status: 'in_use' })
      .eq('id', equipmentId);

    const { data, error } = await supabase
      .from('equipment_assignments')
      .insert({
        equipment_id: equipmentId,
        user_id: userId,
        job_id: jobId,
        condition_at_checkout: conditionAtCheckout
      })
      .select('*')
      .single();

    if (error) throw error;

    console.log('✅ Equipment checked out:', equipmentId);

    return this.mapAssignment(data);
  }

  async checkinEquipment(
    assignmentId: string,
    conditionAtCheckin: string,
    notes?: string
  ): Promise<void> {
    const { data: assignment } = await supabase
      .from('equipment_assignments')
      .select('equipment_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment) throw new Error('Assignment not found');

    await supabase
      .from('equipment_assignments')
      .update({
        checked_in_at: new Date().toISOString(),
        condition_at_checkin: conditionAtCheckin,
        notes
      })
      .eq('id', assignmentId);

    await supabase
      .from('equipment')
      .update({ status: 'available' })
      .eq('id', assignment.equipment_id);

    console.log('✅ Equipment checked in:', assignment.equipment_id);
  }

  async getUserActiveAssignments(userId: string): Promise<EquipmentAssignment[]> {
    const { data } = await supabase
      .from('equipment_assignments')
      .select('*, equipment(*)')
      .eq('user_id', userId)
      .is('checked_in_at', null)
      .order('checked_out_at', { ascending: false });

    if (!data) return [];

    return data.map((a: any) => ({
      ...this.mapAssignment(a),
      equipment: a.equipment ? this.mapEquipment(a.equipment) : undefined
    }));
  }

  async getEquipmentMaintenanceSchedule(): Promise<Array<{
    equipment: Equipment;
    daysUntilMaintenance: number;
    overdue: boolean;
  }>> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .not('next_maintenance', 'is', null)
      .order('next_maintenance');

    if (!data) return [];

    const now = new Date();

    return data.map((eq: any) => {
      const equipment = this.mapEquipment(eq);
      const nextMaintenance = equipment.nextMaintenance;

      if (!nextMaintenance) {
        return {
          equipment,
          daysUntilMaintenance: 999,
          overdue: false
        };
      }

      const diff = nextMaintenance.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      return {
        equipment,
        daysUntilMaintenance: days,
        overdue: days < 0
      };
    });
  }

  async scheduleMainten ance(equipmentId: string, maintenanceDate: Date): Promise<void> {
    await supabase
      .from('equipment')
      .update({
        next_maintenance: maintenanceDate.toISOString(),
        status: 'maintenance'
      })
      .eq('id', equipmentId);

    console.log('✅ Maintenance scheduled for:', equipmentId);
  }

  async completeMainten ance(equipmentId: string): Promise<void> {
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);

    await supabase
      .from('equipment')
      .update({
        last_maintenance: new Date().toISOString(),
        next_maintenance: nextMaintenance.toISOString(),
        status: 'available'
      })
      .eq('id', equipmentId);

    console.log('✅ Maintenance completed for:', equipmentId);
  }

  async generateQRCode(equipmentId: string): Promise<string> {
    const qrCode = `EQ-${Date.now()}-${equipmentId.substring(0, 8)}`;

    await supabase
      .from('equipment')
      .update({ qr_code: qrCode })
      .eq('id', equipmentId);

    return qrCode;
  }

  async scanQRCode(qrCode: string): Promise<Equipment | null> {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    return data ? this.mapEquipment(data) : null;
  }

  async getEquipmentHistory(equipmentId: string): Promise<EquipmentAssignment[]> {
    const { data } = await supabase
      .from('equipment_assignments')
      .select('*, profiles(full_name)')
      .eq('equipment_id', equipmentId)
      .order('checked_out_at', { ascending: false })
      .limit(50);

    if (!data) return [];

    return data.map(this.mapAssignment);
  }

  async getEquipmentUtilization(equipmentId: string): Promise<{
    totalDaysInUse: number;
    averageUsagePerWeek: number;
    utilizationRate: number;
  }> {
    const { data } = await supabase
      .from('equipment_assignments')
      .select('checked_out_at, checked_in_at')
      .eq('equipment_id', equipmentId)
      .not('checked_in_at', 'is', null);

    if (!data || data.length === 0) {
      return {
        totalDaysInUse: 0,
        averageUsagePerWeek: 0,
        utilizationRate: 0
      };
    }

    let totalMinutes = 0;
    data.forEach((assignment: any) => {
      const checkOut = new Date(assignment.checked_out_at);
      const checkIn = new Date(assignment.checked_in_at);
      const diff = checkIn.getTime() - checkOut.getTime();
      totalMinutes += diff / (1000 * 60);
    });

    const totalDays = totalMinutes / (60 * 24);

    const { data: equipment } = await supabase
      .from('equipment')
      .select('created_at')
      .eq('id', equipmentId)
      .single();

    if (!equipment) {
      return {
        totalDaysInUse: totalDays,
        averageUsagePerWeek: 0,
        utilizationRate: 0
      };
    }

    const equipmentAge = (Date.now() - new Date(equipment.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const weeks = equipmentAge / 7;
    const avgPerWeek = totalDays / weeks;
    const utilizationRate = (totalDays / equipmentAge) * 100;

    return {
      totalDaysInUse: Math.round(totalDays),
      averageUsagePerWeek: Math.round(avgPerWeek * 10) / 10,
      utilizationRate: Math.round(utilizationRate)
    };
  }

  private mapEquipment(data: any): Equipment {
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      serialNumber: data.serial_number,
      qrCode: data.qr_code,
      status: data.status,
      lastMaintenance: data.last_maintenance ? new Date(data.last_maintenance) : undefined,
      nextMaintenance: data.next_maintenance ? new Date(data.next_maintenance) : undefined,
      purchaseDate: data.purchase_date ? new Date(data.purchase_date) : undefined,
      condition: data.condition,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapAssignment(data: any): EquipmentAssignment {
    return {
      id: data.id,
      equipmentId: data.equipment_id,
      userId: data.user_id,
      jobId: data.job_id,
      checkedOutAt: new Date(data.checked_out_at),
      checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
      conditionAtCheckout: data.condition_at_checkout,
      conditionAtCheckin: data.condition_at_checkin,
      notes: data.notes
    };
  }
}

export const equipmentManagement = new EquipmentManagementService();
