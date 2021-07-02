import { useState } from "react";

export const useLocalStorageState = (id, initialValue) => {
  const savedValue = localStorage.getItem(id);

  const [value, setValue] = useState(savedValue ?? initialValue);

  return [
    value,
    (newValue) => {
      setValue(newValue);
      localStorage.setItem(id, newValue);
    },
  ];
};
