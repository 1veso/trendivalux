// DocuSeal helper. Used by the Stripe webhook on checkout.session.completed to
// create a contract submission for the customer. The signing URL is embedded in
// the deposit confirmation email and rendered in the /contract/[order_id] page.

export interface CreateSubmissionParams {
  apiKey: string;
  baseUrl: string;
  templateId: string;
  customerEmail: string;
  customerName: string;
  mergeFields: Record<string, string>;
}

export interface DocusealSubmissionResult {
  submissionId: string;
  signingUrl: string;
}

export async function createDocusealSubmission(
  params: CreateSubmissionParams,
): Promise<DocusealSubmissionResult> {
  const response = await fetch(`${params.baseUrl}/submissions`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': params.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: Number(params.templateId),
      send_email: false,
      submitters: [
        {
          email: params.customerEmail,
          name: params.customerName,
          role: 'Client',
          values: params.mergeFields,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DocuSeal API error: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as Array<{
    id: number;
    submission_id: number;
    embed_src: string;
  }>;
  if (!data?.[0]) {
    throw new Error('DocuSeal returned an empty submission list');
  }
  return {
    submissionId: String(data[0].submission_id),
    signingUrl: data[0].embed_src,
  };
}
