'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { Combobox, InputBase, useCombobox } from '@mantine/core';
import { TCompaniesState, TCompany, useCompaniesStore } from '@/stores/companies/companiesStore';
import { capitalizeTitle } from '@/utilities';

const CompaniesSelect = ({
  val,
  onChange,
}: {
  onChange?: (val: string) => void;
  val: TCompany;
}) => {
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

  const exactOptionMatch = Object.entries(companies).some(([key, data]) => data.label === search);

  const filteredOptions = exactOptionMatch
    ? companies
    : Object.entries(companies).reduce<TCompaniesState['companies']>((result, [id, data]) => {
        if (data.label.toLowerCase().includes(search.toLowerCase().trim())) {
          result[id] = data;
        }

        return result;
      }, {});

  const options = Object.entries(filteredOptions).map(([id, data]) => (
    <Combobox.Option value={data.label} key={data.label}>
      {capitalizeTitle(data.label)}
    </Combobox.Option>
  ));

  const handleCreate = (val: string) => {
    if (val === '$create') {
      addCompany(search);
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
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">+ Create {search}</Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default CompaniesSelect;
