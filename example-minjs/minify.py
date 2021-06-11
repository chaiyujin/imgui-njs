import os

src_dir = "../src"
dst_dir = "./scripts"
dst_merged = "./imgui.js"
dst_minify = "./imgui.min.js"
minify_cmd = f"uglifyjs {dst_merged} --compress -o {dst_minify}"

# the order is important
files = [
    'nav.js',
    'winmgr.js',
    'io.js',
    'guictx.js',
    'settings.js',
    'fontmetrics.js',
    'geoutil.js',
    'color.js',
    'style.js',
    'arrayex.js',
    'storage.js',
    'hashutil.js',
    'flags.js',
    'misc.js',
    'drawlist.js',
    'types.js',
    'fontijmap.js',
    'logging.js',
    'enums.js',
    'window.js',
    'datatype.js',
    'font.js',
    'render.js',
    'dragdrop.js',
    'widgets/layout.js',
    'widgets/tab.js',
    'widgets/listbox.js',
    'widgets/selectable.js',
    'widgets/tooltip.js',
    'widgets/slider.js',
    'widgets/text.js',
    'widgets/coloredit.js',
    'widgets/texteditState.js',
    'widgets/tree.js',
    'widgets/plot.js',
    'widgets/popup.js',
    'widgets/combo.js',
    'widgets/inputtext.js',
    'widgets/menu.js',
    'widgets/colorpicker.js',
    'widgets/drag.js',
    'widgets/column.js',
    'widgets/button.js',
    'widgets/scrollbar.js',
    'panels/filebrowser.js',
    'panels/demoLayout.js',
    'panels/demoWidgets.js',
    'panels/styleeditor.js',
    'panels/demoPopups.js',
    'panels/demoMenus.js',
    'panels/demoSimpleLayout.js',
    'panels/log.js',
    'panels/demoColumns.js',
    'panels/demo.js',
    'panels/demoPropertyEditor.js',
    'panels/demoCustomRendering.js',
    'mixins.js',
    'imgui.js',
    'app/prefs.js',
    'app/filesystem.js',
    'app/app.js',
]

script_list = []
merged_file_lines = []
let_vars = {'i': False, 'f': False}
for f in files:
    f_name = os.path.splitext(os.path.basename(f))[0].capitalize()
    src_path = os.path.join(src_dir, f)
    dst_path = os.path.join(dst_dir, f)
    with open(src_path) as fp:
        lines = fp.readlines()
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    merged_file_lines.extend([
        "// =====================================================================================================================\n",
        "// {} BEGIN\n".format(f),
        "// =====================================================================================================================\n",
        "\n",
    ])
    with open(dst_path, "w") as fp:
        see_import = False
        import_meet_from = False
        for line in lines:
            # import - from
            if line.startswith("import"):
                see_import = True
            if see_import:
                import_meet_from = line.find("from") >= 0
                if import_meet_from:
                    see_import = False
                continue
            # export
            if line.startswith("export default ") and line.find("class") < 0:
                continue
            if line.startswith("export default ") and line.find("class") >= 0:
                line = line[15:]
            if line.startswith("export "):
                line = line[7:]
            # some code
            line = line.replace("new Log(", "new LogWindow(")
            # some name
            for key in ["GroupData", "IFmt", "FFmt", "HFmt", "DFmt"]:
                if line.find(key) >= 0:
                    new_name = f_name + key
                    line = line.replace(key, new_name)
            # global local vars
            for key in let_vars:
                if line.find(f'let {key}') == 0:
                    if let_vars[key]:
                        line = line.replace(f'let {key}', key)
                    let_vars[key] = True
            fp.write(line)
            merged_file_lines.append(line)
    merged_file_lines.extend([
        "\n",
        "// =====================================================================================================================\n",
        "// {} END\n".format(f),
        "// =====================================================================================================================\n",
    ])
    script_list.append(dst_path)

for path in script_list:
    path = './' + os.path.relpath(path, ".")
    # print(f"<script src='{path}',")

os.makedirs(os.path.dirname(dst_merged), exist_ok=True)
with open(dst_merged, "w") as fp:
    for line in merged_file_lines:
        fp.write(line)

os.system(minify_cmd)


# # raw process 
# script_list = []
# for root, _, files in os.walk(src_dir):
#     dst_root = os.path.relpath(root, src_dir)
#     dst_root = os.path.abspath(os.path.join(dst_dir, dst_root))
#     os.makedirs(dst_root, exist_ok=True)
#     for f in files:
#         src_path = os.path.join(root, f)
#         dst_path = os.path.join(dst_root, f)
#         with open(src_path) as fp:
#             lines = fp.readlines()
#         with open(dst_path, "w") as fp:
#             for line in lines:
#                 if line.startswith("import"):
#                     continue
#                 if line.startswith("export default ") and line.find("class") < 0:
#                     continue
#                 if line.startswith("export default ") and line.find("class") >= 0:
#                     line = line[15:]
#                 if line.startswith("export "):
#                     line = line[7:]
#                 fp.write(line)
#         script_list.append(dst_path)

# for path in script_list:
#     path = './' + os.path.relpath(path, ".")
#     print(f"<script src='{path}',")
