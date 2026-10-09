import { apiClient } from './client.js';

const MOCK_ENQUIRIES = [
  {
    id: 'mock-1', name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phone: '+91 94432 11223',
    subject: 'Advertisement Inquiry',
    message: 'Hello, I am interested in placing a full-page advertisement on your website for our new product launch next month. Please share your rate card and available slots.',
    status: 'unread', createdAt: '2026-09-22T09:15:00',
  },
  {
    id: 'mock-2', name: 'Priya Shankar', email: 'priya.shankar@yahoo.com', phone: '+91 98760 44512',
    subject: 'News Tip / Press Release',
    message: 'We are organising a district-level yoga camp on October 5th at the Kanyakumari beach. Kindly cover this event in your news portal. Attached is the press release for your reference.',
    status: 'read', createdAt: '2026-09-21T14:30:00',
  },
  {
    id: 'mock-3', name: 'Murugesan A.', email: 'murugesan.a@outlook.com', phone: '+91 77081 99234',
    subject: 'Correction Request',
    message: 'The article published on 20th September about the Nagercoil flyover has incorrect information. The inauguration date mentioned is wrong - it is October 12, not October 8. Please correct it at the earliest.',
    status: 'replied', createdAt: '2026-09-20T11:05:00',
  },
  {
    id: 'mock-4', name: 'Lakshmi Devi', email: 'lakshmi.devi88@gmail.com', phone: '',
    subject: 'Job Application',
    message: 'I am a journalist with 5 years of experience in Tamil print media. I would like to apply for any reporter or content writer position available at Kanyakumari Today. Please let me know how I can submit my resume.',
    status: 'unread', createdAt: '2026-09-19T16:45:00',
  },
  {
    id: 'mock-5', name: 'Suresh Babu', email: 'suresh.babu2026@gmail.com', phone: '+91 90920 33445',
    subject: 'Technical Issue on Website',
    message: 'The video section on your homepage is not loading properly on mobile. I tried on two phones (Android) and the videos show a blank black screen. Please fix this issue.',
    status: 'read', createdAt: '2026-09-18T08:20:00',
  },
  {
    id: 'mock-6', name: 'Kavitha R.', email: 'kavitha.r@hotmail.com', phone: '+91 86080 12345',
    subject: 'Sponsorship Proposal',
    message: 'Our NGO - Green Kanyakumari Foundation - is running a beach cleanup drive this weekend. We would love media coverage and also explore if you offer sponsorship or social media shoutout packages.',
    status: 'replied', createdAt: '2026-09-17T13:10:00',
  },
  {
    id: 'mock-7', name: 'Anand Krishnan', email: 'anand.krishnan@kmail.in', phone: '+91 99400 67890',
    subject: 'General Feedback',
    message: 'I have been reading Kanyakumari Today for over two years. The Tamil content quality has improved a lot recently. Keep up the great work! One suggestion - please add a dark mode option to the website.',
    status: 'read', createdAt: '2026-09-16T10:55:00',
  },
];

const isMockId = (id) => String(id).startsWith('mock-');

const normalizeEnquiry = (enquiry = {}) => ({
  id: enquiry.id,
  name: enquiry.name || '',
  email: enquiry.email || '',
  phone: enquiry.phone || '',
  subject: enquiry.subject || 'General Enquiry',
  message: enquiry.message || '',
  status: enquiry.status || 'unread',
  createdAt: enquiry.createdAt || new Date().toISOString(),
});

export function createContactApi(client = apiClient) {
  return {
    mockEnquiries: () => MOCK_ENQUIRIES.map(normalizeEnquiry),
    isMockId,
    async list(filters = {}, options = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') params.set(key, String(value));
      }
      const query = params.toString();
      const result = await client.request(`/api/admin/contact-submissions${query ? `?${query}` : ''}`, options);
      return { ...result, items: (result.items || []).map(normalizeEnquiry) };
    },
    updateStatus(id, status, options = {}) {
      if (isMockId(id)) return Promise.resolve({ id, status });
      return client.request(`/api/admin/contact-submissions/${encodeURIComponent(id)}/status`, { ...options, method: 'PUT', body: { status } });
    },
    remove(id, options = {}) {
      if (isMockId(id)) return Promise.resolve({ ok: true });
      return client.request(`/api/admin/contact-submissions/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
    },
  };
}

export const contactApi = createContactApi();
