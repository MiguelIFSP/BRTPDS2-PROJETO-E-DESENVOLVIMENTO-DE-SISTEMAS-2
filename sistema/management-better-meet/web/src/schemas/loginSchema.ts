import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .required('Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
  password: yup.string().required('Informe sua senha.'),
});

export type LoginForm = yup.InferType<typeof loginSchema>;
