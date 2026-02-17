import { useEffect, useState } from 'react';
import {
  Avatar,
  Combobox,
  ComboboxProps,
  Group,
  Input,
  InputBase,
  Loader,
  Text,
  useCombobox,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { addCompany } from '@/service/database/companies/addCompany';
import { searchCompany } from '@/service/database/companies/searchCompany';
import { TCompanies, TCompany, TCompanyDraft } from '@/stores/companies/companiesStore';
import EditModal from './EditModal';

const CompanySelector = ({ onChange }: { onChange?: (val: TCompany) => void }) => {
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      combobox.focusTarget();
      setSearch('');
    },
    onDropdownOpen: () => {
      combobox.focusSearchInput();
    },
  });

  const [value, setValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useDebouncedState('', 200);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<TCompanies>({});
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selected, setSelected] = useState<TCompany | null>(null);

  useEffect(() => {
    setDebouncedSearch(search);
  }, [search]);

  useEffect(() => {
    const find = async () => {
      setLoading(true);
      const result = await searchCompany(debouncedSearch);
      if (result.success) {
        setCompanies(result.data);
        setLoading(false);
        combobox.resetSelectedOption();
      }
    };

    if (debouncedSearch !== '') {
      find();
    }
  }, [debouncedSearch]);

  const SelectOption = (data: TCompany) => (
    <Group>
      <Avatar
        size="sm"
        src={`https://cdn.brandfetch.io/domain/${data.domain}?c=${process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID}`}
      />
      <div>
        <Text fz="sm" fw={500}>
          {data.name}
        </Text>
        <Text fz="xs" opacity={0.6}>
          {data.description}
        </Text>
      </div>
    </Group>
  );

  const options = Object.entries(companies).map(([id, data]) => (
    <Combobox.Option value={id} key={id}>
      <SelectOption {...data} />
    </Combobox.Option>
  ));

  const handleAdd = async ({ name, description, domain }: TCompanyDraft) => {
    const result = await addCompany({ name, description, domain });

    if (result.success) {
      const newCompany = result.data;
      setCompanies((prev) => ({ ...prev, [newCompany.id]: newCompany }));
      setValue(String(newCompany.id));
      onChange?.(result.data);
    }
  };

  const handleSubmit: ComboboxProps['onOptionSubmit'] = (val) => {
    if (val === '$create') {
      setShowCreateModal(true);
    } else {
      setValue(val);

      const selectedOption: TCompany | undefined = Object.entries(companies)
        .map(([id, data]) => ({ ...data, id: Number(id) }))
        .find((item) => item.id === Number(val));

      if (selectedOption) {
        setSelected(selectedOption);
        onChange?.(selectedOption);
      }
    }

    combobox.closeDropdown();
  };

  return (
    <>
      <Combobox store={combobox} withinPortal onOptionSubmit={handleSubmit}>
        <Combobox.Target>
          <InputBase
            label="Forhandler"
            component="button"
            type="button"
            rightSection={loading ? <Loader size={18} /> : <Combobox.Chevron />}
            value={search}
            onClick={() => combobox.openDropdown()}
            rightSectionPointerEvents="none"
          >
            {selected ? <SelectOption {...selected} /> : <Input.Placeholder>Søg</Input.Placeholder>}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Søg efter firma"
          />
          <Combobox.Options>
            {options.length > 0 ? (
              options
            ) : loading ? (
              <Combobox.Empty>Henter..</Combobox.Empty>
            ) : (
              <>
                <Combobox.Option value="$create">+ Create {search}</Combobox.Option>
                <Combobox.Empty>Ingen resultater</Combobox.Empty>
              </>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      <EditModal search={search} add={handleAdd} active={showCreateModal} />
    </>
  );
};

export default CompanySelector;
