'use client';

import { IconFileTypeCsv, IconUpload, IconX } from '@tabler/icons-react';
import { Group, rem, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';

type TProps = { onFile: (content: string) => void };

const CSVDropzone: React.FC<TProps> = ({ onFile }) => {
  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const tryRead = (encoding: string) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file, encoding);
      });

    tryRead('utf-8').then((content) => {
      if (content.includes('\ufffd')) {
        return tryRead('windows-1252').then(onFile);
      }
      onFile(content);
    });
  };

  return (
    <Dropzone onDrop={handleDrop} accept={['text/csv', 'text/plain', '.csv']} maxFiles={1}>
      <Group justify="center" gap="xl" mih={180} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFileTypeCsv size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
        </Dropzone.Idle>
        <div>
          <Text size="xl" inline>
            Træk din CSV-fil hertil
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Understøtter Danske Bank og generisk CSV-format
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
};

export default CSVDropzone;
