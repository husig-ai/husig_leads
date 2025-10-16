import { Lead } from '@/types/database'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial_outreach',
    name: 'Initial Outreach',
    subject: 'Helping {{company_name}} with {{service_interest}}',
    body: `Hi {{first_name}},

I hope this message finds you well. I came across {{company_name}} and was impressed by your work in the {{industry}} industry.

I noticed you're interested in {{service_interest}}, and I believe we could help {{company_name}} achieve your goals more efficiently.

At HuSig, we specialize in:
- Advanced analytics and data engineering
- AI/ML model development and deployment
- Custom dashboard and reporting solutions

Given your {{timeline}} timeline and the challenges in {{pain_point}}, I'd love to discuss how we could support your initiative.

Would you be available for a brief 15-minute call this week to explore potential synergies?

Best regards,
{{sender_name}}

P.S. I'd be happy to share some case studies relevant to your industry and use case.`,
    variables: ['first_name', 'company_name', 'service_interest', 'industry', 'timeline', 'pain_point', 'sender_name']
  },
  {
    id: 'follow_up',
    name: 'Follow-up',
    subject: 'Re: {{service_interest}} solution for {{company_name}}',
    body: `Hi {{first_name}},

I wanted to follow up on my previous message regarding {{service_interest}} solutions for {{company_name}}.

I understand you're working on {{pain_point}}, and with your {{timeline}} timeline, time is likely of the essence.

I've helped similar {{company_size}} companies in {{industry}} achieve:
- 40% reduction in data processing time
- 60% improvement in prediction accuracy
- 25% increase in operational efficiency

I'd love to share a brief case study that might be relevant to your situation.

Are you available for a quick 10-minute call this week?

Best regards,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'service_interest', 'pain_point', 'timeline', 'company_size', 'industry', 'sender_name']
  },
  {
    id: 'demo_invitation',
    name: 'Demo Invitation',
    subject: 'Quick demo: {{service_interest}} solution for {{company_name}}',
    body: `Hi {{first_name}},

Thank you for your interest in our {{service_interest}} solutions.

I'd like to invite you to a personalized demo where we can show you exactly how we can help {{company_name}} with {{pain_point}}.

During the demo, we'll cover:
- Live demonstration of our platform
- Custom solutions for your {{industry}} use case
- ROI projections based on your requirements
- Next steps for implementation

The demo typically takes 30 minutes, and I'll make sure it's tailored specifically to {{company_name}}'s needs.

Are you available for a demo next week? I have slots available on:
- {{meeting_date}} at {{meeting_time}}
- Alternative times if these don't work

Looking forward to showing you what's possible!

Best regards,
{{sender_name}}

Meeting Link: {{meeting_link}}`,
    variables: ['first_name', 'company_name', 'service_interest', 'pain_point', 'industry', 'meeting_date', 'meeting_time', 'meeting_link', 'sender_name']
  },
  {
    id: 'proposal_follow_up',
    name: 'Proposal Follow-up',
    subject: 'Proposal for {{company_name}} - Next steps',
    body: `Hi {{first_name}},

I hope you had a chance to review the proposal we sent for {{company_name}}'s {{service_interest}} project.

To recap, our solution will help you:
- Address your key challenge: {{pain_point}}
- Deliver results within your {{timeline}} timeframe
- Provide measurable ROI within the first quarter

I'd love to answer any questions you might have and discuss the next steps.

Would you be available for a brief call this week to go over the proposal details?

Looking forward to potentially partnering with {{company_name}}!

Best regards,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'service_interest', 'pain_point', 'timeline', 'sender_name']
  },
  {
    id: 'check_in',
    name: 'Check-in',
    subject: 'Checking in on {{company_name}}\'s {{service_interest}} initiative',
    body: `Hi {{first_name}},

I hope everything is going well at {{company_name}}.

I wanted to check in on your {{service_interest}} initiative. I know you mentioned {{pain_point}} as a key challenge, and I'm curious about how things are progressing.

If you're still exploring solutions or if anything has changed with your requirements, I'd be happy to discuss how we might be able to help.

No pressure at all - just wanted to stay connected and offer support if needed.

Best regards,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'service_interest', 'pain_point', 'sender_name']
  }
]

export function getLeadVariables(lead: Lead, senderName: string = 'Your Name') {
  return {
    first_name: lead.first_name,
    last_name: lead.last_name,
    company_name: lead.company_name,
    industry: lead.industry,
    job_title: lead.job_title,
    company_size: lead.company_size,
    timeline: lead.project_timeline,
    pain_point: lead.pain_point,
    service_interest: Array.isArray(lead.service_interest) 
      ? lead.service_interest.join(', ') 
      : lead.service_interest,
    sender_name: senderName,
    // Placeholders for meeting details (to be filled by user)
    meeting_date: '[Date]',
    meeting_time: '[Time]',
    meeting_link: '[Meeting Link]',
  }
}

export function interpolateTemplate(template: EmailTemplate, variables: Record<string, string>) {
  let subject = template.subject
  let body = template.body

  // Replace all variables in subject and body
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value || `[${key}]`)
    body = body.replace(new RegExp(placeholder, 'g'), value || `[${key}]`)
  })

  return { subject, body }
}

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(template => template.id === id)
}