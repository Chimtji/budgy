import { Avatar } from '@mantine/core';

const BRANDFETCH_CLIENT_ID = '1idK-liBhmg3xSpkhuS';

type TProps = {
  domain: string | null;
  name: string;
  size?: number;
};

const CompanyLogo: React.FC<TProps> = ({ domain, name, size = 28 }) => {
  if (!domain) {
    return (
      <Avatar size={size} radius="sm" color="violet" variant="light">
        {name.charAt(0).toUpperCase()}
      </Avatar>
    );
  }

  return (
    <Avatar
      size={size}
      radius="sm"
      src={`https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`}
      alt={`${name} logo`}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
};

export default CompanyLogo;
