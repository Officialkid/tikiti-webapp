import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/(auth)/register/page';
import { AuthProvider } from '@/lib/contexts/AuthContext';

// Mock Firebase
jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

describe('Registration Form', () => {

  test('A.2.1 — renders all form fields', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
  });

  test('A.2.2 — shows error for invalid email', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    const emailInput = screen.getByPlaceholderText('Email');
    await userEvent.type(emailInput, 'not-an-email');
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  test('A.2.3 — rejects weak password (no uppercase)', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    await userEvent.type(passwordInput, 'alllowercase1');
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
    });
  });

  test('A.2.4 — rejects password mismatch', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    const [pass, confirm] = screen.getAllByLabelText(/password/i);
    await userEvent.type(pass, 'Password1');
    await userEvent.type(confirm, 'Password2');
    fireEvent.blur(confirm);
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  test('A.2.5 — rejects invalid Kenyan phone', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    const phoneInput = screen.getByPlaceholderText('Phone');
    await userEvent.type(phoneInput, '123456');
    fireEvent.blur(phoneInput);
    await waitFor(() => {
      expect(screen.getByText(/invalid kenyan phone/i)).toBeInTheDocument();
    });
  });

  test('A.2.6 — accepts valid Kenyan phone formats', async () => {
    const validPhones = ['0712345678', '254712345678', '+254712345678', '0733123456'];
    for (const phone of validPhones) {
      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );
      const phoneInput = screen.getByPlaceholderText('Phone');
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, phone);
      fireEvent.blur(phoneInput);
      await waitFor(() => {
        expect(screen.queryByText(/invalid kenyan phone/i)).not.toBeInTheDocument();
      });
    }
  });

  test('A.2.7 — role selection defaults to customer', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    const customerRadio = screen.getByDisplayValue('customer') as HTMLInputElement;
    expect(customerRadio.checked).toBe(true);
  });
});
