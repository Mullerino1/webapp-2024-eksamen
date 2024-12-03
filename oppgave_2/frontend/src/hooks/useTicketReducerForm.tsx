//Just about this entire code is from the courses and Marius Wallin
"use client"


import { useEffect, useReducer, type FormEvent } from "react";

type FieldState = {
  value: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
};

const FormAction = {
  UPDATE_FIELD: "UPDATE_FIELD",
  SET_TOUCHED: "SET_TOUCHED",
  RESET_FORM: "RESET_FORM",
} as const;

type FormAction = typeof FormAction;

type FormActions<T extends Record<string, string>> =
  | {
      type: FormAction["UPDATE_FIELD"];
      field: keyof T;
      value: string;
      isValid: boolean;
    }
  | { type: FormAction["SET_TOUCHED"]; field: keyof T }
  | { type: FormAction["RESET_FORM"]; fields?: Fields<T> };

type UseFormProps<T> = {
  initialFields: T;
  onSubmit: (data: T) => void;
  validate: {
    [K in keyof T]?: (field: K, value: string) => boolean;
  };
};

type Fields<T> = Record<keyof T, FieldState>;
type FormState<T extends Record<string, string>> = Fields<T>;



function formReducer<T extends Record<string, string>>(
  state: FormState<T>,
  action: FormActions<T>
): FormState<T> {
  switch (action.type) {
    case FormAction.UPDATE_FIELD:
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          value: action.value,
          isValid: action.isValid,
          isDirty: true,
        },
      };
    case FormAction.SET_TOUCHED:
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          isTouched: true,
        },
      };
    case FormAction.RESET_FORM:
      if (action.fields) return action.fields;

      return Object.fromEntries(
        Object.keys(state).map((key) => [
          key,
          {
            value: "",
            isValid: false,
            isDirty: false,
            isTouched: false,
          },
        ])
      ) as Fields<T>;
    default:
      return state;
  }
}

export function useTicketReducerForm<T extends Record<string, string>>({
initialFields,
onSubmit,
validate,
}: UseFormProps<T>) {
const [state, dispatch] = useReducer(
  formReducer<T>,
  Object.fromEntries(
    Object.keys(initialFields).map((key) => [
      key as keyof T,
      {
        value: initialFields[key as keyof T],
        isValid: false,
        isDirty: false,
        isTouched: false,
      } as FieldState,
    ])
  ) as Fields<T>
);


  const updateField = (field: keyof T, value: string) => {
    const isValid = validate[field] ? validate[field](field, value) : true;
    dispatch({ type: FormAction.UPDATE_FIELD, field, value, isValid });
  };

  const setFieldTouched = (field: keyof T) => {
    dispatch({ type: FormAction.SET_TOUCHED, field });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredfields = ['name', 'email', 'phonenumber', 'people']
    const isFormValid = requiredfields.every(field =>
      state[field as keyof T].isValid
    )
    if (!isFormValid) return;

    const formData = Object.fromEntries(
      Object.keys(state).map((key) => [key, state[key as keyof T].value])
    ) as T;

    onSubmit(formData);
    dispatch({ type: FormAction.RESET_FORM });
  };

const getFieldProps = (field: keyof T) => ({
    value: state[field].value,
    onChange: (event: FormEvent<HTMLInputElement>) => {
      const input = event.target as HTMLInputElement;
      updateField(field, input.value);
    },
    onBlur: () => setFieldTouched(field),
  });

  const isFieldInvalid = (field: keyof T) =>
    !state[field].isValid && state[field].isDirty;

  return {
    fields: state,
    handleSubmit,
    getFieldProps,
    isFieldInvalid,
  };
}

export default useTicketReducerForm;