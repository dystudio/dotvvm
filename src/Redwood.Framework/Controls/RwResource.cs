﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Redwood.Framework.Controls
{
    public abstract class RwResource
    {
        public virtual IEnumerable<string> Dependencies { get; set; }

        public abstract void Render(IHtmlWriter writer);
    }
}
