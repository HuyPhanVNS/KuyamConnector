using System;
namespace InfoConn.Config
{
    public interface ISettingService
    {
        string GetSetting(string name);
        bool GetSettingBoolean(string name);
        int GetSettingInteger(string name);
        bool TryGetSetting(string name, out string result);
        bool TryGetSettingBoolean(string name, out bool result);
        bool TryGetSettingInteger(string name, out int result);
    }
}
