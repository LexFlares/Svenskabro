import type { Contact } from "@/types";

export const contacts: Contact[] = [
  {
    id: "1",
    full_name: "Anders Andersson",
    role: "Projektledare",
    phone: "070-123 45 67",
    email: "anders.andersson@example.com",
    company: "Bro & Väg AB",
    avatar_url: "https://i.pravatar.cc/150?u=anders",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
    username: "andersa"
  },
  {
    id: "2",
    full_name: "Birgitta Bengtsson",
    role: "Inspektör",
    phone: "072-234 56 78",
    email: "birgitta.bengtsson@example.com",
    company: "Trafikverket",
    avatar_url: "https://i.pravatar.cc/150?u=birgitta",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
    username: "birgittab"
  },
  {
    id: "3",
    full_name: "Carl Carlsson",
    role: "Arbetsledare",
    phone: "073-345 67 89",
    email: "carl.carlsson@example.com",
    company: "Bro & Väg AB",
    avatar_url: "https://i.pravatar.cc/150?u=carl",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
    username: "carlc"
  },
  {
    id: "4",
    full_name: "David Davidsson",
    role: "Reparatör",
    phone: "076-456 78 90",
    email: "david.davidsson@example.com",
    company: "Underhåll AB",
    avatar_url: "https://i.pravatar.cc/150?u=david",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "inactive",
    username: "davidd"
  },
  {
    id: "5",
    full_name: "Eva Evasdotter",
    role: "KMA-samordnare",
    phone: "079-567 89 01",
    email: "eva.evasdotter@example.com",
    company: "Säkerhet & Kvalitet AB",
    avatar_url: "https://i.pravatar.cc/150?u=eva",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
    username: "evae"
  }
];
