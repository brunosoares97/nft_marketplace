import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

const CreateCategory = ({ onSubmit }) => {
	const [newCategory, setNewCategory] = useState('');

	const handleInputChange = (event) => {
		setNewCategory(event.target.value);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		onSubmit(newCategory);
		setNewCategory('');
	};

	return (
		<Form onSubmit={handleSubmit} className="d-flex">
			<Form.Control
				type="text"
				value={newCategory}
				onChange={handleInputChange}
				placeholder="New Category"
				className="me-2"
			/>
			<Button type="submit">Create</Button>
		</Form>
	);
};

export default CreateCategory;
