import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const CONTACT_INFO = [
  { icon: Mail, label: 'Email Us', value: 'hello@givehope.in' },
  { icon: Phone, label: 'Call Us', value: '+91 98765 43210' },
  { icon: MapPin, label: 'Office', value: 'Mumbai, Maharashtra, India' },
  { icon: Clock, label: 'Support Hours', value: 'Mon–Sat, 9am–6pm IST' },
];

export default function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    reset();
  }

  return (
    <motion.div {...pageVariants}>

      {/* Page header */}
      <section style={{
        background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        padding: '72px 0 60px', textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ color: '#fff', marginBottom: 14 }}>Get In Touch</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
            Have a question, feedback, or want to list your charity? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="contact-layout">

            {/* Info panel */}
            <div className="contact-panel">
              <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 12 }}>Contact Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 15, marginBottom: 40, lineHeight: 1.65 }}>
                Reach out through any channel below. Our team typically responds within one business day.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 48 }}>
                {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-accent)', flexShrink: 0,
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
                      }}>
                        {label}
                      </div>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 28 }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.65 }}>
                  Want to register your charity on GiveHope? Head to our{' '}
                  <a href="/register" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                    registration page
                  </a>
                  {' '}and select "Register as Charity" to get started.
                </p>
              </div>
            </div>

            {/* Form panel */}
            <div className="contact-form-panel">
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Send Us a Message</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 32 }}>
                All fields are required.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="contact-name-email">
                  <Input
                    label="Your Name"
                    placeholder="Priya Sharma"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="priya@example.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Input
                    label="Subject"
                    placeholder="How can we help you?"
                    error={errors.subject?.message}
                    {...register('subject', { required: 'Subject is required' })}
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{
                    display: 'block', fontWeight: 600, fontSize: 14,
                    marginBottom: 8, color: 'var(--color-text)',
                  }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                      border: errors.message
                        ? '1.5px solid var(--color-error)'
                        : '1.5px solid var(--color-border)',
                      fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
                      lineHeight: 1.6, color: 'var(--color-text)', background: '#fff',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors.message
                        ? 'var(--color-error)'
                        : 'var(--color-border)';
                    }}
                    {...register('message', {
                      required: 'Message is required',
                      minLength: { value: 20, message: 'Message must be at least 20 characters' },
                    })}
                  />
                  {errors.message && (
                    <span style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 4, display: 'block' }}>
                      {errors.message.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </motion.div>
  );
}
