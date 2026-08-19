import {
    fetchContacts,
    fetchMessages,
    fetchTemplates,
    fetchCampaigns,
    fetchConversation,
    fetchEmails,
    fetchEmailsByContact,
    sendMessage,
    sendEmail,
    createTemplate,
    createCampaign,
    sendCampaign,
    createContact,
    deleteTemplate,
    deleteCampaign,
    updateContact,
    deleteContact,
    deleteMessageById,
    deleteConversationByContact,
    deleteEmailById,
    deleteEmailsByContact,
    updateCampaign,
} from "../api/api";

export function useAppHandlers({
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
}) {
    const showAlert = (variant, message) => {
        setAlert({ variant, message });
        setTimeout(() => setAlert(null), 2500);
    };

    const resetTemplateForm = () => {
        setTemplateForm({
            userId: "user123",
            name: "",
            category: "general",
            body: "",
        });
    };

    const resetContactForm = () => {
        setContactForm({
            userId: "user123",
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            tags: "",
            notes: "",
        });
    };

    const resetCampaignForm = () => {
        setCampaignForm({
            userId: "user123",
            name: "",
            subject: "",
            type: "sms",
            templateId: "",
            contactIds: [],
            scheduledAt: "",
        });
    };

    const resetMessageForm = () => {
        setMessageForm(prev => ({
            ...prev,
            body: "",
            templateId: "",
        }));
    };

    const resetEmailForm = () => {
        setEmailForm(prev => ({
            ...prev,
            subject: "",
            body: "",
            templateId: "",
        }));
    };

    const loadData = async () => {
        const [contactsData, messagesData, templatesData, campaignsData, emailsData] =
            await Promise.all([
                fetchContacts(),
                fetchMessages(),
                fetchTemplates(),
                fetchCampaigns(),
                fetchEmails(),
            ]);

        setContacts(contactsData);
        setMessages(messagesData);
        setTemplates(templatesData);
        setCampaigns(campaignsData);
        setEmails(emailsData);
    };

    const refreshSelectedConversation = async contactId => {
        if (!contactId) return;
        const data = await fetchConversation(contactId);
        setConversation(data);
    };

    const refreshSelectedEmails = async contactId => {
        if (!contactId) return;
        const emailData = await fetchEmailsByContact(contactId);
        setEmailMessages(emailData);
    };

    const handleSelectContact = async contact => {
        setSelectedContact(contact);

        setMessageForm(prev => ({
            ...prev,
            contactId: contact._id,
        }));

        setEmailForm(prev => ({
            ...prev,
            contactId: contact._id,
            toEmail: contact.email || "",
        }));

        setLoadingConversation(true);
        await refreshSelectedConversation(contact._id);
        setLoadingConversation(false);

        setLoadingEmails(true);
        await refreshSelectedEmails(contact._id);
        setLoadingEmails(false);
    };

    const handleSendMessage = async (e, messageForm) => {
        e.preventDefault();
        await sendMessage(messageForm);
        resetMessageForm();
        await loadData();

        if (selectedContact) {
            await refreshSelectedConversation(selectedContact._id);
        }

        showAlert("success", "Message sent successfully");
    };

    const handleSendEmail = async (e, emailForm) => {
        e.preventDefault();
        await sendEmail(emailForm);
        resetEmailForm();

        if (selectedContact) {
            await refreshSelectedEmails(selectedContact._id);
        }

        await loadData();
        showAlert("success", "Email sent successfully");
    };

    const handleCreateTemplate = async (e, templateForm) => {
        e.preventDefault();
        await createTemplate(templateForm);
        resetTemplateForm();
        await loadData();
        showAlert("success", "Template created");
    };

    const handleCreateContact = async (e, contactForm) => {
        e.preventDefault();

        if (editingContact) {
            await updateContact(editingContact._id, contactForm);
            setEditingContact(null);
            showAlert("success", "Contact updated");
        } else {
            await createContact(contactForm);
            showAlert("success", "Contact added");
        }

        resetContactForm();
        await loadData();
    };

    const handleEditContact = contact => {
        setEditingContact(contact);

        setContactForm({
            userId: contact.userId || "user123",
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            phone: contact.phone || "",
            email: contact.email || "",
            tags: contact.tags || "",
            notes: contact.notes || "",
        });
    };

    const handleCancelEditContact = () => {
        setEditingContact(null);
        resetContactForm();
    };

    const handleDeleteContact = async contactId => {
        await deleteContact(contactId);
        await loadData();

        if (selectedContact && selectedContact._id === contactId) {
            setSelectedContact(null);
            setConversation([]);
            setEmailMessages([]);
        }

        showAlert("danger", "Contact deleted");
    };

    const handleToggleContact = contactId => {
        setCampaignForm(prev => ({
            ...prev,
            contactIds: prev.contactIds.includes(contactId)
                ? prev.contactIds.filter(id => id !== contactId)
                : [...prev.contactIds, contactId],
        }));
    };

    const handleCreateCampaign = async (e, campaignForm) => {
        e.preventDefault();
        await createCampaign(campaignForm);
        resetCampaignForm();
        await loadData();
        showAlert("success", "Campaign created");
    };

    const handleUpdateCampaign = async (campaignId, payload) => {
        await updateCampaign(campaignId, payload);
        await loadData();
        showAlert("success", "Campaign updated");
    };

    const handleSendCampaign = async campaignId => {
        await sendCampaign(campaignId);
        await loadData();
        showAlert("success", "Campaign sent");
    };

    const handleDeleteTemplate = async templateId => {
        await deleteTemplate(templateId);
        await loadData();
        showAlert("danger", "Template deleted");
    };

    const handleDeleteCampaign = async campaignId => {
        await deleteCampaign(campaignId);
        await loadData();
        showAlert("danger", "Campaign deleted");
    };

    const handleDeleteMessage = async messageId => {
        await deleteMessageById(messageId);

        if (selectedContact) {
            await refreshSelectedConversation(selectedContact._id);
        }

        await loadData();
        showAlert("danger", "Message deleted");
    };

    const handleDeleteConversation = async contactId => {
        await deleteConversationByContact(contactId);

        if (selectedContact && selectedContact._id === contactId) {
            setConversation([]);
        }

        await loadData();
        showAlert("danger", "Conversation deleted");
    };

    const handleDeleteEmail = async emailId => {
        await deleteEmailById(emailId);

        if (selectedContact) {
            await refreshSelectedEmails(selectedContact._id);
        }

        await loadData();
        showAlert("danger", "Email deleted");
    };

    const handleDeleteEmailConversation = async contactId => {
        await deleteEmailsByContact(contactId);

        if (selectedContact && selectedContact._id === contactId) {
            setEmailMessages([]);
        }

        await loadData();
        showAlert("danger", "Email conversation deleted");
    };

    return {
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
        handleUpdateCampaign,
        handleSendCampaign,
        handleDeleteTemplate,
        handleDeleteCampaign,
        handleDeleteMessage,
        handleDeleteConversation,
        handleDeleteEmail,
        handleDeleteEmailConversation,
    };
}
