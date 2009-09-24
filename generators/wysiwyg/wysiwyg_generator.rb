class WysiwygGenerator < Rails::Generator::Base 
  def manifest 
    record do |m|
      
      # assets 
      m.directory "public/wysiwyg"
      m.directory "public/wysiwyg/images"
      m.file "public/wysiwyg.js", "public/wysiwyg/wysiwyg.js"
      m.file "public/wysiwyg.css", "public/wysiwyg/wysiwyg.css" 
      m.file "public/images/rte_colorpicker_gray.jpg", "public/wysiwyg/images/rte_colorpicker_gray.jpg"
      m.file "public/images/rte_colorpicker_rgb.jpg", "public/wysiwyg/images/rte_colorpicker_rgb.jpg"
      m.file "public/images/rte_icons.gif", "public/wysiwyg/images/rte_icons.gif"
      m.file "public/images/spinner.gif", "public/wysiwyg/images/spinner.gif"
            
      # controller & model
      m.file "controllers/wysiwyg_pictures_controller.rb", "app/controllers/wysiwyg_pictures_controller.rb"
      m.file "models/wysiwyg_picture.rb", "app/models/wysiwyg_picture.rb"
      
      # routes & migrations
      m.route_resources :wysiwyg_pictures
      m.migration_template "create_wysiwyg_pictures.rb", "db/migrate"             
    end
  end
  
  def file_name
      "create_wysiwyg_pictures"
    end
  
end 