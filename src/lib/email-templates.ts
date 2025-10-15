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
    subject: 'Transforming {{company_name}}\'s Data into Strategic Insights',
    body: `Hi {{first_name}},

I hope this message finds you well. I came across {{company_name}} and was impressed by your work in {{industry}}.

At HuSig, we specialize in helping organizations like yours unlock the full potential of their data through:
• Advanced Analytics & Dashboarding
• AI/ML Model Development
• Predictive Analytics
• Custom Data Engineering Solutions

Given your focus on {{pain_point}}, I believe we could add significant value to your operations.

Would you be open to a brief 15-minute call to explore how we might help {{company_name}} achieve its data and AI goals?

Best regards,
{{sender_name}}
HuSig.ai`,
    variables: ['first_name', 'company_name', 'industry', 'pain_point', 'sender_name']
  },
  {
    id: 'follow_up_1',
    name: 'Follow-up (After 3 days)',
    subject: 'Quick follow-up: Data Solutions for {{company_name}}',
    body: `Hi {{first_name}},

I wanted to follow up on my previous email regarding data and AI solutions for {{company_name}}.

I understand you're busy, so I'll keep this brief. We've helped similar {{industry}} companies:
• Increase operational efficiency by 30%
• Reduce costs through predictive analytics
• Accelerate decision-making with real-time dashboards

If {{project_timeline}} works for your timeline, I'd love to share some relevant case studies and discuss how we can help.

Are you available for a quick call this week?

Best,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'industry', 'project_timeline', 'sender_name']
  },
  {
    id: 'meeting_scheduled',
    name: 'Meeting Confirmation',
    subject: 'Confirmed: Our meeting about {{company_name}}\'s data strategy',
    body: `Hi {{first_name}},

Great! I'm looking forward to our conversation about {{company_name}}'s data and AI initiatives.

Meeting Details:
• Date: {{meeting_date}}
• Time: {{meeting_time}}
• Duration: 30 minutes
• Link: {{meeting_link}}

To make the most of our time, I'd love to learn more about:
1. Your current data infrastructure and challenges
2. Specific use cases you're exploring for {{service_interest}}
3. Your goals for the next 6-12 months

Feel free to share any questions you'd like to discuss beforehand.

Looking forward to connecting!

Best,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'meeting_date', 'meeting_time', 'meeting_link', 'service_interest', 'sender_name']
  },
  {
    id: 'proposal_sent',
    name: 'Proposal Sent',
    subject: 'Proposal: Data & AI Solutions for {{company_name}}',
    body: `Hi {{first_name}},

Thank you for the great conversation earlier! I enjoyed learning about {{company_name}}'s vision for {{pain_point}}.

As discussed, I've attached a proposal outlining how HuSig can help you:
• {{service_interest}}
• Projected timeline: {{project_timeline}}
• Estimated budget range: {{budget_range}}

Key highlights:
✓ Proven track record in {{industry}}
✓ Dedicated team of ML engineers and data scientists
✓ End-to-end support from development to deployment

I'm confident we can deliver exceptional results. Would you be available for a quick call next week to discuss the proposal?

Best regards,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'pain_point', 'service_interest', 'project_timeline', 'budget_range', 'industry', 'sender_name']
  },
  {
    id: 'check_in',
    name: 'Check-in After Demo',
    subject: 'Following up on our demo for {{company_name}}',
    body: `Hi {{first_name}},

I hope you've had a chance to review the demo and materials we shared.

I wanted to check in and see if you have any questions or if there's anything else I can provide to help with your decision-making process.

Some clients in {{industry}} have found these resources helpful:
• Case study from similar implementation
• Technical architecture deep-dive
• ROI calculator

Would any of these be useful for your team?

Best,
{{sender_name}}`,
    variables: ['first_name', 'company_name', 'industry', 'sender_name']
  }
]

// Function to interpolate variables in email template
export function interpolateTemplate(
  template: EmailTemplate, 
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject
  let body = template.body

  // Replace all {{variable}} instances with actual values
  template.variables.forEach(variable => {
    const value = variables[variable] || `{{${variable}}}`
    const regex = new RegExp(`{{${variable}}}`, 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  })

  return { subject, body }
}

// Get variables from a lead for email templates
export function getLeadVariables(lead: any, senderName: string = 'Your Name'): Record<string, string> {
  return {
    first_name: lead.first_name,
    last_name: lead.last_name,
    company_name: lead.company_name,
    industry: lead.industry,
    pain_point: lead.pain_point,
    project_timeline: lead.project_timeline,
    budget_range: lead.budget_range || 'to be discussed',
    service_interest: Array.isArray(lead.service_interest) 
      ? lead.service_interest.join(', ') 
      : lead.service_interest,
    sender_name: senderName,
    // Add placeholders for meeting details
    meeting_date: '[Date]',
    meeting_time: '[Time]',
    meeting_link: '[Meeting Link]',
  }
}