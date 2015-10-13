using System;
using System.Collections.Generic;
using System.Linq;
using DotVVM.Framework.Hosting;
using DotVVM.Framework.Parser;
using DotVVM.Framework.Runtime;
using DotVVM.Framework.Binding;
using DotVVM.Framework.Exceptions;

namespace DotVVM.Framework.Controls
{
    /// <summary>
    /// Renders a script that is executed when the DotVVM framework is loaded.
    /// </summary>
    public class InlineScript : DotvvmControl
    {

        /// <summary>
        /// Gets or sets the comma-separated list of resources that should be loaded before this script is executed.
        /// </summary>
        public string Dependencies
        {
            get { return (string)GetValue(DependenciesProperty); }
            set { SetValue(DependenciesProperty, value); }
        }
        public static readonly DotvvmProperty DependenciesProperty =
            DotvvmProperty.Register<string, InlineScript>(c => c.Dependencies);



        internal override void OnPreRenderComplete(IDotvvmRequestContext context)
        {
            EnsureControlHasId();

            if (!Children.All(c => c is Literal))
            {
                throw new DotvvmControlException(this, "The <dot:InlineScript>...</dot:InlineScript> control can only contain text content!");
            }
            
            var script = string.Concat(Children.Cast<Literal>().Select(c => c.Text));
            var dep = Dependencies?.Split(',') ?? new string[] { Constants.DotvvmResourceName };
            context.ResourceManager.AddStartupScript("inlinescript_" + ID, script, dep);
            
            base.OnPreRenderComplete(context);
        }

        protected override void RenderContents(IHtmlWriter writer, RenderContext context)
        {
            // don't render anything
        }
    }
}
