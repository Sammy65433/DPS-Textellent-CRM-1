import { Form, Button } from "react-bootstrap";

function TemplateForm({
    templateForm,
    setTemplateForm,
    onCreateTemplate,
}) {
    return (
        <Form onSubmit={onCreateTemplate}>
            <Form.Control
                className="mb-3"
                placeholder="Template name"
                value={templateForm.name}
                onChange={e =>
                    setTemplateForm(prev => ({
                        ...prev,
                        name: e.target.value,
                    }))
                }
            />

            <Form.Control
                as="textarea"
                rows={5}
                className="mb-3"
                placeholder="Template body"
                value={templateForm.body}
                onChange={e =>
                    setTemplateForm(prev => ({
                        ...prev,
                        body: e.target.value,
                    }))
                }
            />

            <Button type="submit" variant="primary" className="w-100">
                Save Template
            </Button>
        </Form>
    );
}

export default TemplateForm;
