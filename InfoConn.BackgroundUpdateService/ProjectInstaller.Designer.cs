namespace InfoConn.BackgroundUpdateService
{
    partial class ProjectInstaller
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.InfoConnServiceProcessInstaller = new System.ServiceProcess.ServiceProcessInstaller();
            this.InfoConnServiceInstaller = new System.ServiceProcess.ServiceInstaller();
            // 
            // InfoConnServiceProcessInstaller
            // 
            this.InfoConnServiceProcessInstaller.Account = System.ServiceProcess.ServiceAccount.LocalSystem;
            this.InfoConnServiceProcessInstaller.Password = null;
            this.InfoConnServiceProcessInstaller.Username = null;
            // 
            // InfoConnServiceInstaller
            // 
            this.InfoConnServiceInstaller.ServiceName = "InfoConnService";
            // 
            // ProjectInstaller
            // 
            this.Installers.AddRange(new System.Configuration.Install.Installer[] {
            this.InfoConnServiceProcessInstaller,
            this.InfoConnServiceInstaller});

        }

        #endregion

        private System.ServiceProcess.ServiceProcessInstaller InfoConnServiceProcessInstaller;
        private System.ServiceProcess.ServiceInstaller InfoConnServiceInstaller;
    }
}