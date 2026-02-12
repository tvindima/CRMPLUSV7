# Security Policy

## Reporting a Vulnerability
Please report suspected vulnerabilities privately to the maintainers before
public disclosure.

Suggested channel:
- Open a private security advisory in GitHub for this repository, or
- Contact project maintainers through approved internal/company channels.

Please include:
- Affected component/path
- Reproduction steps
- Impact and severity estimate
- Suggested mitigation (if available)

## Response Expectations
- Initial acknowledgment target: 3 business days
- Triage and severity classification after reproduction
- Coordinated disclosure after fix rollout

## Security Posture (Baseline)
- No secrets should be committed to source control.
- Dependencies should be monitored for known vulnerabilities and license risks.
- Principle of least privilege for runtime credentials.
- Tenant data isolation controls must be validated in multi-tenant flows.
