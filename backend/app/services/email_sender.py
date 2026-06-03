from config import settings

def send_invitation_email(to_email: str, candidate_name: str, session_link: str):
    """
    Sends an invitation email to the candidate.
    """
    # Placeholder for SMTP logic using 'emails' library or smtplib
    print(f"Sending email to {to_email}: Welcome {candidate_name}. Join here: {session_link}")
    return True
