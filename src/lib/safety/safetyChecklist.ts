import { supabase } from '@/lib/supabase';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'ppe' | 'equipment' | 'environment' | 'procedure' | 'documentation';
  required: boolean;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: Date;
  notes?: string;
  photoRequired: boolean;
  photoUrl?: string;
}

export interface SafetyChecklist {
  id: string;
  jobId: string;
  bridgeId: string;
  userId: string;
  items: ChecklistItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  completionTime?: Date;
  completionPercentage: number;
  createdAt: Date;
}

export class SafetyChecklistService {
  async createChecklist(jobId: string, bridgeId: string, userId: string): Promise<SafetyChecklist> {
    const items = this.generateChecklistItems(bridgeId);

    const checklist: SafetyChecklist = {
      id: `checklist_${Date.now()}`,
      jobId,
      bridgeId,
      userId,
      items,
      status: 'pending',
      completionPercentage: 0,
      createdAt: new Date()
    };

    await this.saveChecklist(checklist);

    console.log('✅ Created safety checklist with', items.length, 'items');
    return checklist;
  }

  private generateChecklistItems(bridgeId: string): ChecklistItem[] {
    const items: ChecklistItem[] = [
      {
        id: 'ppe_1',
        title: 'Varningsväst',
        description: 'Reflexväst klass 2 eller 3 ska bäras hela tiden',
        category: 'ppe',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'ppe_2',
        title: 'Hjälm',
        description: 'Skyddshjälm som uppfyller EN 397 ska användas',
        category: 'ppe',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'ppe_3',
        title: 'Säkerhetsskor',
        description: 'Skyddsskor S3 med stålhätta och punkteringsskydd',
        category: 'ppe',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'ppe_4',
        title: 'Fallskydd',
        description: 'Säkerhetssele och förankringslina vid höjdarbete över 2 meter',
        category: 'ppe',
        required: false,
        checked: false,
        photoRequired: true
      },
      {
        id: 'equipment_1',
        title: 'Arbetsredskap kontrollerat',
        description: 'Alla verktyg och maskiner är besiktigade och funktionella',
        category: 'equipment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'equipment_2',
        title: 'Trafiksäkring',
        description: 'Vägkoner, varningsskyltar och ev. trafiksignalister på plats',
        category: 'equipment',
        required: true,
        checked: false,
        photoRequired: true
      },
      {
        id: 'equipment_3',
        title: 'Kommunikationsutrustning',
        description: 'Radio eller telefon fungerar och är laddad',
        category: 'equipment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'equipment_4',
        title: 'Första hjälpen-utrustning',
        description: 'Komplett första hjälpen-väska finns tillgänglig',
        category: 'equipment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'environment_1',
        title: 'Väderförhållanden',
        description: 'Vädret är lämpligt för arbete. Vid stark vind/regn, avbryt.',
        category: 'environment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'environment_2',
        title: 'Arbetsområde inspekterat',
        description: 'Inga uppenbara faror eller hinder i arbetsområdet',
        category: 'environment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'environment_3',
        title: 'Nedfall-risk bedömd',
        description: 'Risk för nedfall av föremål uppmärksammad och åtgärdad',
        category: 'environment',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'procedure_1',
        title: 'Arbetsbeskrivning läst',
        description: 'TA-plan och arbetsbeskrivning är genomläst och förstådd',
        category: 'procedure',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'procedure_2',
        title: 'Riskbedömning utförd',
        description: 'Specifika risker för detta jobb är identifierade',
        category: 'procedure',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'procedure_3',
        title: 'Nödutgångar identifierade',
        description: 'Evakueringsvägar och samlingsplats är klargjord',
        category: 'procedure',
        required: true,
        checked: false,
        photoRequired: false
      },
      {
        id: 'documentation_1',
        title: 'Tillstånd hämtat',
        description: 'Arbetstillstånd från Trafikverket eller liknande finns',
        category: 'documentation',
        required: true,
        checked: false,
        photoRequired: true
      },
      {
        id: 'documentation_2',
        title: 'Kontaktuppgifter',
        description: 'Nödkontakter och arbetsledare är sparade i telefon',
        category: 'documentation',
        required: true,
        checked: false,
        photoRequired: false
      }
    ];

    return items;
  }

  async checkItem(
    checklistId: string,
    itemId: string,
    userId: string,
    checked: boolean,
    notes?: string,
    photoUrl?: string
  ): Promise<void> {
    const { data } = await supabase
      .from('safety_checklists')
      .select('*')
      .eq('id', checklistId)
      .single();

    if (!data) throw new Error('Checklist not found');

    const checklist: SafetyChecklist = JSON.parse(data.data);

    const item = checklist.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    item.checked = checked;
    item.checkedBy = userId;
    item.checkedAt = new Date();
    if (notes) item.notes = notes;
    if (photoUrl) item.photoUrl = photoUrl;

    const percentage = this.calculateCompletion(checklist.items);
    checklist.completionPercentage = percentage;

    if (percentage === 100) {
      checklist.status = 'completed';
      checklist.completionTime = new Date();
    } else {
      checklist.status = 'in_progress';
    }

    await this.saveChecklist(checklist);

    console.log('✅ Checked item:', item.title);
  }

  private calculateCompletion(items: ChecklistItem[]): number {
    const requiredItems = items.filter(i => i.required);
    const checkedRequired = requiredItems.filter(i => i.checked);
    return Math.round((checkedRequired.length / requiredItems.length) * 100);
  }

  async getChecklist(checklistId: string): Promise<SafetyChecklist | null> {
    const { data } = await supabase
      .from('safety_checklists')
      .select('*')
      .eq('id', checklistId)
      .single();

    return data ? JSON.parse(data.data) : null;
  }

  async canStartJob(checklistId: string): Promise<{ canStart: boolean; reason?: string }> {
    const checklist = await this.getChecklist(checklistId);

    if (!checklist) {
      return { canStart: false, reason: 'Säkerhetschecklista hittades inte' };
    }

    if (checklist.status !== 'completed') {
      const unchecked = checklist.items.filter(i => i.required && !i.checked);
      if (unchecked.length > 0) {
        return {
          canStart: false,
          reason: `${unchecked.length} obligatoriska säkerhetspunkter är inte avklarade:\n${unchecked.map(i => `- ${i.title}`).join('\n')}`
        };
      }
    }

    const photoRequiredItems = checklist.items.filter(i => i.photoRequired && i.checked && !i.photoUrl);
    if (photoRequiredItems.length > 0) {
      return {
        canStart: false,
        reason: `Fotodokumentation saknas för: ${photoRequiredItems.map(i => i.title).join(', ')}`
      };
    }

    return { canStart: true };
  }

  async getItemsByCategory(checklistId: string, category: ChecklistItem['category']): Promise<ChecklistItem[]> {
    const checklist = await this.getChecklist(checklistId);
    if (!checklist) return [];

    return checklist.items.filter(i => i.category === category);
  }

  private async saveChecklist(checklist: SafetyChecklist): Promise<void> {
    await supabase
      .from('safety_checklists')
      .upsert({
        id: checklist.id,
        job_id: checklist.jobId,
        bridge_id: checklist.bridgeId,
        user_id: checklist.userId,
        status: checklist.status,
        completion_percentage: checklist.completionPercentage,
        data: JSON.stringify(checklist),
        created_at: checklist.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  async exportChecklistPDF(checklistId: string): Promise<Blob> {
    const checklist = await this.getChecklist(checklistId);
    if (!checklist) throw new Error('Checklist not found');

    const content = `
# Säkerhetschecklista

**Jobb ID:** ${checklist.jobId}
**Bro ID:** ${checklist.bridgeId}
**Datum:** ${checklist.createdAt.toLocaleString('sv-SE')}
**Status:** ${checklist.status}
**Slutförd:** ${checklist.completionPercentage}%

## Checklistepunkter

${checklist.items.map(item => `
### ${item.title} ${item.checked ? '✅' : '❌'}
**Kategori:** ${item.category}
**Obligatorisk:** ${item.required ? 'Ja' : 'Nej'}
**Beskrivning:** ${item.description}
${item.notes ? `**Noteringar:** ${item.notes}` : ''}
${item.checkedBy ? `**Kontrollerad av:** ${item.checkedBy}` : ''}
${item.checkedAt ? `**Tidpunkt:** ${item.checkedAt.toLocaleString('sv-SE')}` : ''}
`).join('\n')}
    `.trim();

    return new Blob([content], { type: 'application/pdf' });
  }
}

export const safetyChecklist = new SafetyChecklistService();
