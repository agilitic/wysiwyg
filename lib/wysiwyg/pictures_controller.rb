module Wysiwyg
  class PicturesController < ActionController::Base
    skip_before_filter :verify_authenticity_token

    def create
      @picture = initialize_picture
      @element_id = params[:element_id]

      respond_to do |format|      
        format.js do
          if @picture.save
            render_success
          else
            render :nothing => true
          end
        end
      end
    end

    def initialize_picture
      Wysiwyg::Picture.new(:file => params[:file])
    end
    
    def render_success
      responds_to_parent do
        render :js => "wysiwyg.#{@element_id}.editor_cmd('insertImage', '#{@picture.file.url}');"
      end
    end
  end
end