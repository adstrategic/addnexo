// Components
export { ClientActions } from "./components/ClientAction";
export { ClientTable } from "./components/ClientTable";
export { ClientDetails } from "./components/ClientDetail";
export { ClientFilters } from "./components/ClientFilter";
export { ClientsContent } from "./components/ClientContent";

// Forms
export { ClientForm } from "./forms/ClientForm";
export { ClientFormModal } from "./forms/ClientFormModal";

// Hooks
export {
  useClients,
  useClientBySequence,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  clientKeys,
} from "./hooks/useClients";
export { useClientActions } from "./hooks/useClientActions";
export { useClientManager } from "./hooks/useClientFormManager";
export { useClientDelete } from "./hooks/useClientDelete";

// Services
export { clientsService } from "./services/ClientsServices";

// Schemas & DTOs
export type {
  ClientFormData,
  CreateClientDto,
  UpdateClientDto,
  ClienteResponse,
  ClientesResponse,
  ListClientsParams,
} from "./schemas/ClientSchema";

// Utils
export * from "./lib/utils";
