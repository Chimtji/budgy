'use client';

import { useState } from 'react';
import { Modal, Stack, TextInput, Textarea, ColorInput, Button, Group } from '@mantine/core';

type TCategory = { id: string; key: string; label: string; color: string; icon: string; description: string };

type TProps = {
  category?: TCategory;
  onSave: (data: Omit<TCategory, 'id'>) => void;
  onClose: () => void;
};

const CategoryForm: React.FC<TProps> = ({ category, onSave, onClose }) => {
  const [key, setKey] = useState(category?.key ?? '');
  const [label, setLabel] = useState(category?.label ?? '');
  const [color, setColor] = useState(category?.color ?? '#228be6');
  const [icon, setIcon] = useState(category?.icon ?? '');
  const [description, setDescription] = useState(category?.description ?? '');

  const handleSave = () => {
    if (!key || !label) return;
    onSave({ key, label, color, icon, description });
    onClose();
  };

  const isEditing = !!category;

  return (
    <Modal
      opened
      onClose={onClose}
      title={isEditing ? 'Rediger kategori' : 'Ny kategori'}
    >
      <Stack>
        <TextInput
          label="Nøgle"
          value={key}
          onChange={(e) => setKey(e.currentTarget.value)}
          disabled={isEditing}
          placeholder="f.eks. groceries"
          required
        />
        <TextInput
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          placeholder="Dansk navn"
          required
        />
        <ColorInput
          label="Farve"
          value={color}
          onChange={setColor}
        />
        <TextInput
          label="Ikon"
          value={icon}
          onChange={(e) => setIcon(e.currentTarget.value)}
          placeholder="f.eks. IconShoppingBag"
        />
        <Textarea
          label="Beskrivelse"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Annuller</Button>
          <Button onClick={handleSave}>Gem</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default CategoryForm;
