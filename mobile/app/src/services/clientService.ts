/**
 * clientService - Serviço para gestão de clientes
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

export interface Client {
  id: number;
  agent_id: number;
  agency_id?: number;
  client_type: string;
  origin: string;
  nome: string;
  nif?: string;
  cc?: string;
  cc_validade?: string;
  data_nascimento?: string;
  nacionalidade?: string;
  estado_civil?: string;
  profissao?: string;
  email?: string;
  telefone?: string;
  telefone_alt?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  distrito?: string;
  notas?: string;
  tags?: string[];
  ultima_interacao?: string;
  proxima_acao?: string;
  proxima_acao_data?: string;
  angariacao_id?: number;
  property_id?: number;
  lead_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientCreateData {
  nome: string;
  client_type?: string;
  origin?: string;
  nif?: string;
  cc?: string;
  cc_validade?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string;
  telefone_alt?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  notas?: string;
  angariacao_id?: number;
}

class ClientService {
  /**
   * Listar clientes de um agente
   */
  async getClientsByAgent(
    agentId: number,
    options?: {
      clientType?: string;
      search?: string;
      isActive?: boolean;
    }
  ): Promise<{ total: number; items: Client[] }> {
    const params = new URLSearchParams({
      agent_id: agentId.toString(),
    });

    if (options?.clientType) {
      params.append('client_type', options.clientType);
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.isActive !== undefined) {
      params.append('is_active', options.isActive.toString());
    }

    const response = await fetch(`${API_URL}/clients/?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar clientes');
    }

    return response.json();
  }

  /**
   * Obter um cliente específico
   */
  async getClient(clientId: number): Promise<Client> {
    const response = await fetch(`${API_URL}/clients/${clientId}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Cliente não encontrado');
    }

    return response.json();
  }

  /**
   * Criar novo cliente
   */
  async createClient(agentId: number, data: ClientCreateData, agencyId?: number): Promise<Client> {
    const params = new URLSearchParams({
      agent_id: agentId.toString(),
    });
    if (agencyId) {
      params.append('agency_id', agencyId.toString());
    }

    const response = await fetch(`${API_URL}/clients/?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar cliente');
    }

    return response.json();
  }

  /**
   * Atualizar cliente
   */
  async updateClient(clientId: number, data: Partial<Client>): Promise<Client> {
    const response = await fetch(`${API_URL}/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar cliente');
    }

    return response.json();
  }

  /**
   * Atualizar notas de um cliente
   */
  async updateNotes(clientId: number, notas: string): Promise<{ success: boolean; notas: string }> {
    const response = await fetch(
      `${API_URL}/clients/${clientId}/notes?notas=${encodeURIComponent(notas)}`,
      {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao atualizar notas');
    }

    return response.json();
  }

  /**
   * Eliminar cliente (soft delete)
   */
  async deleteClient(clientId: number): Promise<void> {
    const response = await fetch(`${API_URL}/clients/${clientId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao eliminar cliente');
    }
  }

  /**
   * Obter aniversários próximos
   */
  async getUpcomingBirthdays(
    agentId: number,
    daysAhead: number = 7
  ): Promise<{ total: number; items: (Client & { days_until_birthday: number; birthday_date: string; age: number })[] }> {
    const response = await fetch(
      `${API_URL}/clients/birthdays?agent_id=${agentId}&days_ahead=${daysAhead}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Erro ao carregar aniversários');
    }

    return response.json();
  }

  /**
   * Obter estatísticas de clientes
   */
  async getStats(agentId: number): Promise<{
    total: number;
    by_type: Record<string, number>;
    vendedores: number;
    compradores: number;
    investidores: number;
    arrendatarios: number;
    senhorios: number;
    leads: number;
  }> {
    const response = await fetch(`${API_URL}/clients/stats?agent_id=${agentId}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar estatísticas');
    }

    return response.json();
  }

  /**
   * Criar cliente automaticamente a partir de angariação/CMI
   * Chamado quando OCR detecta proprietário
   */
  async createFromAngariacao(
    agentId: number,
    angariacaoId: number,
    data: {
      nome: string;
      nif?: string;
      cc?: string;
      cc_validade?: string;
      data_nascimento?: string;
      telefone?: string;
      email?: string;
      morada?: string;
    },
    agencyId?: number
  ): Promise<{ success: boolean; action: 'created' | 'updated'; client: Client }> {
    const params = new URLSearchParams({
      agent_id: agentId.toString(),
      angariacao_id: angariacaoId.toString(),
      nome: data.nome,
    });

    if (agencyId) params.append('agency_id', agencyId.toString());
    if (data.nif) params.append('nif', data.nif);
    if (data.cc) params.append('cc', data.cc);
    if (data.cc_validade) params.append('cc_validade', data.cc_validade);
    if (data.data_nascimento) params.append('data_nascimento', data.data_nascimento);
    if (data.telefone) params.append('telefone', data.telefone);
    if (data.email) params.append('email', data.email);
    if (data.morada) params.append('morada', data.morada);

    const response = await fetch(`${API_URL}/clients/from-angariacao?${params}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar cliente');
    }

    return response.json();
  }
}

export const clientService = new ClientService();
export default clientService;
