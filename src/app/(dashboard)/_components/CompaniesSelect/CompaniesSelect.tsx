'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { Combobox, InputBase, useCombobox } from '@mantine/core';
import { TCompanies, TCompany, useCompaniesStore } from '@/stores/companies/companiesStore';
import { capitalizeTitle } from '@/utilities';

const CompaniesSelect = ({ val, onChange }: { onChange?: (val: string) => void; val: string }) => {
  const { companies, addCompany } = useCompaniesStore(
    useShallow((state) => ({
      companies: state.companies,
      addCompany: state.addCompany,
    }))
  );

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [value, setValue] = useState<string | null>(val);
  const [search, setSearch] = useState('');

  const match = Object.entries(companies).some(([key, data]) => data.name === search);

  const filteredOptions = match
    ? companies
    : Object.entries(companies).reduce<TCompanies>((result, [id, data]) => {
        if (data.name.toLowerCase().includes(search.toLowerCase().trim())) {
          result[id] = data;
        }

        return result;
      }, {});

  const options = Object.entries(filteredOptions).map(([id, data]) => (
    <Combobox.Option value={data.name} key={data.name}>
      {capitalizeTitle(data.name)}
    </Combobox.Option>
  ));

  const handleCreate = (val: string) => {
    if (val === '$create') {
      // addCompany(search);
      setValue(search);
      onChange?.(search);
    } else {
      onChange?.(val);
      setValue(val);
      setSearch(val);
    }

    combobox.closeDropdown();
  };

  return (
    <Combobox store={combobox} withinPortal={false} onOptionSubmit={handleCreate}>
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          value={search || val}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || '');
          }}
          label="Forhandler"
          placeholder="Vælg Forhandler"
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!match && search.trim().length > 0 && (
            <Combobox.Option value="$create">+ Create {search}</Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default CompaniesSelect;
