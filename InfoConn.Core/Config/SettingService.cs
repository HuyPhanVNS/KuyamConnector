using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InfoConn.Config
{
    public class SettingService : ISettingService
    {
        public string GetSetting(string name)
        {
            string result = System.Configuration.ConfigurationManager.AppSettings.Get(name);
            if (result != null)
            {
                return result;
            }

            throw new ArgumentException(string.Format("Setting name {0} not found.", name), "name");
        }

        public bool TryGetSetting(string name, out string result)
        {
            result = System.Configuration.ConfigurationManager.AppSettings.Get(name);
            if (result != null)
            {
                return true;
            }

            return false;
        }

        public int GetSettingInteger(string name)
        {
            return int.Parse(GetSetting(name));
        }

        public bool TryGetSettingInteger(string name, out int result)
        {
            string setting;
            if (TryGetSetting(name, out setting))
            {
                return int.TryParse(setting, out result);
            }

            result = default(int);

            return false;
        }

        public bool GetSettingBoolean(string name)
        {
            return bool.Parse(GetSetting(name));
        }

        public bool TryGetSettingBoolean(string name, out bool result)
        {
            string setting;
            if (TryGetSetting(name, out setting))
            {
                return bool.TryParse(setting, out result);
            }

            result = default(bool);

            return false;
        }
    }
}