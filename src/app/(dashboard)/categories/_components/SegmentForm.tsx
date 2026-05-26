'use client';

import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';

type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};

type TProps = {
  segment?: TSegment;
  categoryKey: string;
  onSave: (data: Omit<TSegment, 'id'>) => void;
  onClose: () => void;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const SegmentForm: React.FC<TProps> = ({ segment, categoryKey, onSave, onClose }) => {
  const [label, setLabel] = useState(segment?.label ?? '');
  const [description, setDescription] = useState(segment?.description ?? '');

  const key = segment?.key ?? slugify(label);

  useEffect(() => {
    if (!segment) setLabel('');
  }, [segment]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      key: key || slugify(label),
      category_key: categoryKey,
      label: label.trim(),
      description,
    });
    onClose();
  };

  return (
    <Modal opened onClose={onClose} title={segment ? 'Rediger segment' : 'Nyt segment'}>
      <Stack>
        <TextInput
          label="Navn"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          placeholder="f.eks. Dagligvarer"
          required
          data-autofocus
        />
        <Textarea
          label="Beskrivelse"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Gem
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default SegmentForm;
