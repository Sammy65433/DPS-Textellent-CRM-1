import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import ContactsPage from "./pages/ContactsPage";
import TemplatesPage from "./pages/TemplatesPage";
import CampaignsPage from "./pages/CampaignsPage";
import EmailsPage from "./pages/EmailsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAppHandlers } from "./handlers/useAppHandlers";
import "./styles/app.css";

function App() {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [emailMessages, setEmailMessages] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [alert, setAlert] = useState(null);
  const [editingContact, setEditingContact] = useState(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const [messageForm, setMessageForm] = useState({
    userId: "user123",
    contactId: "",
    body: "",
    templateId: "",
  });

  const [templateForm, setTemplateForm] = useState({
    userId: "user123",
    name: "",
    body: "",
  });

  const [campaignForm, setCampaignForm] = useState({
    userId: "user123",
    name: "",
    templateId: "",
    contactIds: [],
  });

  const [contactForm, setContactForm] = useState({
    userId: "user123",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    tags: "",
  });

  const [emailForm, setEmailForm] = useState({
    userId: "user123",
    contactId: "",
    toEmail: "",
    subject: "",
    body: "",
    templateId: "",
  });

  const {
    loadData,
    handleSelectContact,
    handleSendMessage,
    handleSendEmail,
    handleCreateTemplate,
    handleCreateContact,
    handleEditContact,
    handleCancelEditContact,
    handleDeleteContact,
    handleToggleContact,
    handleCreateCampaign,
    handleSendCampaign,
    handleDeleteTemplate,
    handleDeleteCampaign,
    handleDeleteMessage,
    handleDeleteConversation,
    handleDeleteEmail,
    handleDeleteEmailConversation,
  } = useAppHandlers({
    setContacts,
    setMessages,
    setTemplates,
    setCampaigns,
    setEmails,
    setSelectedContact,
    setConversation,
    setEmailMessages,
    setLoadingConversation,
    setLoadingEmails,
    setMessageForm,
    setTemplateForm,
    setCampaignForm,
    setContactForm,
    setEmailForm,
    setAlert,
    selectedContact,
    editingContact,
    setEditingContact,
  });

  useEffect(() => {
    loadData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              theme={theme}
              onToggleTheme={toggleTheme}
              alert={alert}
              contacts={contacts}
              messages={messages}
              templates={templates}
              campaigns={campaigns}
              emails={emails}
            />
          }
        />

        <Route
          path="/contacts"
          element={
            <ContactsPage
              theme={theme}
              onToggleTheme={toggleTheme}
              alert={alert}
              contacts={contacts}
              selectedContact={selectedContact}
              conversation={conversation}
              loadingConversation={loadingConversation}
              messageForm={messageForm}
              setMessageForm={setMessageForm}
              contactForm={contactForm}
              setContactForm={setContactForm}
              templates={templates}
              editingContact={editingContact}
              emailForm={emailForm}
              setEmailForm={setEmailForm}
              onSelectContact={handleSelectContact}
              onSendMessage={e => handleSendMessage(e, messageForm)}
              onSendEmail={e => handleSendEmail(e, emailForm)}
              onCreateContact={e => handleCreateContact(e, contactForm)}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              onCancelEditContact={handleCancelEditContact}
              onDeleteMessage={handleDeleteMessage}
              onDeleteConversation={handleDeleteConversation}
            />
          }
        />

        <Route
          path="/templates"
          element={
            <TemplatesPage
              theme={theme}
              onToggleTheme={toggleTheme}
              alert={alert}
              templates={templates}
              templateForm={templateForm}
              setTemplateForm={setTemplateForm}
              onCreateTemplate={e => handleCreateTemplate(e, templateForm)}
              onDeleteTemplate={handleDeleteTemplate}
            />
          }
        />

        <Route
          path="/campaigns"
          element={
            <CampaignsPage
              theme={theme}
              onToggleTheme={toggleTheme}
              alert={alert}
              campaigns={campaigns}
              campaignForm={campaignForm}
              setCampaignForm={setCampaignForm}
              templates={templates}
              contacts={contacts}
              onCreateCampaign={e => handleCreateCampaign(e, campaignForm)}
              onToggleContact={contactId =>
                handleToggleContact(contactId, campaignForm)
              }
              onSendCampaign={handleSendCampaign}
              onDeleteCampaign={handleDeleteCampaign}
            />
          }
        />

        <Route
          path="/emails"
          element={
            <EmailsPage
              theme={theme}
              onToggleTheme={toggleTheme}
              alert={alert}
              contacts={contacts}
              selectedContact={selectedContact}
              emailMessages={emailMessages}
              loadingEmails={loadingEmails}
              emailForm={emailForm}
              setEmailForm={setEmailForm}
              contactForm={contactForm}
              setContactForm={setContactForm}
              templates={templates}
              editingContact={editingContact}
              onSelectContact={handleSelectContact}
              onSendEmail={e => handleSendEmail(e, emailForm)}
              onCreateContact={e => handleCreateContact(e, contactForm)}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              onCancelEditContact={handleCancelEditContact}
              onDeleteEmail={handleDeleteEmail}
              onDeleteEmailConversation={handleDeleteEmailConversation}
            />
          }
        />

        <Route
          path="*"
          element={
            <NotFoundPage
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
