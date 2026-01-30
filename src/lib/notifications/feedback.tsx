import { IconCircleCheck, IconExclamationCircle, IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './notifications.module.css';

export const showSuccessNotification = ({ title, message }: { title: string; message: string }) => {
  const icon = <IconCircleCheck size={40} />;
  notifications.show({
    position: 'bottom-right',
    title,
    message,
    classNames: classes,
    color: 'green',
    withCloseButton: false,
    icon: icon,
  });
};

export const showLoadingNotification = ({ title, message }: { title: string; message: string }) => {
  const icon = <IconInfoCircle size={40} />;
  notifications.show({
    position: 'bottom-right',
    title,
    message,
    classNames: classes,
    color: 'blue',
    withCloseButton: false,
    icon: icon,
  });
};

export const showErrorNotification = ({ title, message }: { title: string; message: string }) => {
  const icon = <IconExclamationCircle size={40} />;

  notifications.show({
    position: 'bottom-right',
    title,
    message,
    classNames: classes,
    color: 'red',
    withCloseButton: false,
    icon: icon,
  });
};

export const showWarningNotification = ({ title, message }: { title: string; message: string }) => {
  const icon = <IconExclamationCircle size={40} />;

  notifications.show({
    position: 'bottom-right',
    title,
    message,
    classNames: classes,
    color: 'yellow',
    withCloseButton: false,
    icon: icon,
  });
};
